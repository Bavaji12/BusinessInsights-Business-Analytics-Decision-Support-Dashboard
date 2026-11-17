from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import Customer, Product, Order, OrderItem, Feedback

def parse_date_filters(
    date_filter: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    reference_date: Optional[datetime] = None
) -> Tuple[Optional[datetime], Optional[datetime], Optional[datetime], Optional[datetime]]:
    """
    Parses date parameters and returns (current_start, current_end, previous_start, previous_end)
    to enable MoM / period-over-period comparative analytics.
    """
    ref = reference_date or datetime(2026, 11, 15, 23, 59, 59)
    current_end = ref
    current_start = None

    if date_filter == "7d":
        current_start = ref - timedelta(days=7)
        duration = timedelta(days=7)
    elif date_filter == "30d":
        current_start = ref - timedelta(days=30)
        duration = timedelta(days=30)
    elif date_filter == "90d":
        current_start = ref - timedelta(days=90)
        duration = timedelta(days=90)
    elif date_filter == "1y" or date_filter == "year":
        current_start = ref - timedelta(days=365)
        duration = timedelta(days=365)
    elif date_filter == "custom" and start_date and end_date:
        try:
            current_start = datetime.fromisoformat(start_date.replace("Z", ""))
            current_end = datetime.fromisoformat(end_date.replace("Z", ""))
            duration = current_end - current_start
        except Exception:
            current_start = ref - timedelta(days=30)
            duration = timedelta(days=30)
    elif date_filter == "all":
        current_start = None
        duration = None
    else: # default 30d
        current_start = ref - timedelta(days=30)
        duration = timedelta(days=30)

    if current_start and duration:
        previous_end = current_start
        previous_start = current_start - duration
    else:
        previous_start = None
        previous_end = None

    return current_start, current_end, previous_start, previous_end


def compute_dashboard_summary(
    db: Session,
    date_filter: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    reference_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """Calculates all top-level KPI metrics safely with period comparisons."""
    c_start, c_end, p_start, p_end = parse_date_filters(date_filter, start_date, end_date, reference_date=reference_date)

    # Base query for orders
    order_query = db.query(Order)
    if c_start:
        order_query = order_query.filter(Order.order_date >= c_start, Order.order_date <= c_end)
    if region and region != "All":
        order_query = order_query.filter(Order.region == region)

    orders = order_query.all()
    total_orders = len(orders)
    
    # Revenue = Sum of completed order amounts
    completed_orders = [o for o in orders if o.status == "Completed"]
    total_revenue = sum(o.total_amount for o in completed_orders)
    completed_count = len(completed_orders)
    avg_order_value = round(total_revenue / completed_count, 2) if completed_count > 0 else 0.0

    # Total customers
    customer_query = db.query(Customer)
    if region and region != "All":
        customer_query = customer_query.filter(Customer.region == region)
    total_customers = customer_query.count()

    # Active customers in period (placed at least 1 order)
    active_customers = len(set(o.customer_id for o in orders))

    # Previous period for growth calculations
    prev_revenue = 0.0
    if p_start and p_end:
        prev_query = db.query(Order).filter(
            Order.order_date >= p_start,
            Order.order_date < p_end,
            Order.status == "Completed"
        )
        if region and region != "All":
            prev_query = prev_query.filter(Order.region == region)
        prev_orders = prev_query.all()
        prev_revenue = sum(o.total_amount for o in prev_orders)

    if prev_revenue > 0:
        revenue_growth_pct = round(((total_revenue - prev_revenue) / prev_revenue) * 100, 2)
    else:
        revenue_growth_pct = 0.0

    # Customer satisfaction score (average rating)
    feedback_query = db.query(Feedback)
    if c_start:
        feedback_query = feedback_query.filter(Feedback.created_at >= c_start, Feedback.created_at <= c_end)
    feedbacks = feedback_query.all()
    if feedbacks:
        csat_score = round(sum(f.rating for f in feedbacks) / len(feedbacks), 2)
    else:
        # Fallback to all-time average if period has no reviews
        all_fb = db.query(Feedback).all()
        csat_score = round(sum(f.rating for f in all_fb) / len(all_fb), 2) if all_fb else 0.0

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "total_customers": total_customers,
        "active_customers": active_customers,
        "average_order_value": avg_order_value,
        "revenue_growth_pct": revenue_growth_pct,
        "customer_satisfaction_score": csat_score,
        "period_start": c_start.strftime("%Y-%m-%d") if c_start else "All Time",
        "period_end": c_end.strftime("%Y-%m-%d") if c_end else "Current",
        "filter_applied": date_filter
    }


def compute_revenue_trend(
    db: Session,
    date_filter: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Calculates revenue trend points grouped by day or month."""
    c_start, c_end, _, _ = parse_date_filters(date_filter, start_date, end_date)

    query = db.query(Order).filter(Order.status == "Completed")
    if c_start:
        query = query.filter(Order.order_date >= c_start, Order.order_date <= c_end)
    if region and region != "All":
        query = query.filter(Order.region == region)

    orders = query.all()
    if not orders:
        return []

    # Choose aggregation interval: if duration <= 60 days, aggregate by day; else by month
    by_day = False
    if c_start and (c_end - c_start).days <= 60:
        by_day = True

    records = []
    for o in orders:
        if by_day:
            key = o.order_date.strftime("%Y-%m-%d")
            label = o.order_date.strftime("%b %d")
        else:
            key = o.order_date.strftime("%Y-%m")
            label = o.order_date.strftime("%b %Y")
        records.append({"key": key, "label": label, "amount": o.total_amount})

    df = pd.DataFrame(records)
    grouped = df.groupby(["key", "label"]).agg(
        revenue=("amount", "sum"),
        orders_count=("amount", "count")
    ).reset_index()

    grouped = grouped.sort_values(by="key")

    result = []
    for _, row in grouped.iterrows():
        rev = round(float(row["revenue"]), 2)
        cnt = int(row["orders_count"])
        aov = round(rev / cnt, 2) if cnt > 0 else 0.0
        result.append({
            "period": str(row["key"]),
            "date_label": str(row["label"]),
            "revenue": rev,
            "orders_count": cnt,
            "avg_order_value": aov
        })
    return result


def compute_category_sales(
    db: Session,
    date_filter: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Calculates sales and volume grouped by Product Category."""
    c_start, c_end, _, _ = parse_date_filters(date_filter, start_date, end_date)

    query = db.query(
        Product.category,
        func.sum(OrderItem.quantity * OrderItem.unit_price).label("total_revenue"),
        func.sum(OrderItem.quantity).label("units_sold"),
        func.count(func.distinct(Order.id)).label("orders_count")
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, Order.id == OrderItem.order_id)\
     .filter(Order.status == "Completed")

    if c_start:
        query = query.filter(Order.order_date >= c_start, Order.order_date <= c_end)
    if region and region != "All":
        query = query.filter(Order.region == region)

    query = query.group_by(Product.category).order_by(desc("total_revenue"))
    rows = query.all()

    total_all_revenue = sum((r.total_revenue or 0.0) for r in rows)

    result = []
    for r in rows:
        rev = round(float(r.total_revenue or 0.0), 2)
        pct = round((rev / total_all_revenue * 100), 1) if total_all_revenue > 0 else 0.0
        result.append({
            "category": r.category,
            "total_revenue": rev,
            "units_sold": int(r.units_sold or 0),
            "orders_count": int(r.orders_count or 0),
            "percentage": pct
        })
    return result


def compute_regional_performance(
    db: Session,
    date_filter: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Calculates revenue, orders, and customer counts grouped by Region."""
    c_start, c_end, _, _ = parse_date_filters(date_filter, start_date, end_date)

    query = db.query(
        Order.region,
        func.sum(Order.total_amount).label("revenue"),
        func.count(Order.id).label("orders_count"),
        func.count(func.distinct(Order.customer_id)).label("customer_count")
    ).filter(Order.status == "Completed")

    if c_start:
        query = query.filter(Order.order_date >= c_start, Order.order_date <= c_end)

    query = query.group_by(Order.region).order_by(desc("revenue"))
    rows = query.all()

    total_rev = sum((r.revenue or 0.0) for r in rows)

    result = []
    for r in rows:
        rev = round(float(r.revenue or 0.0), 2)
        pct = round((rev / total_rev * 100), 1) if total_rev > 0 else 0.0
        result.append({
            "region": r.region,
            "revenue": rev,
            "orders_count": int(r.orders_count or 0),
            "customer_count": int(r.customer_count or 0),
            "percentage": pct
        })
    return result


def compute_order_status_distribution(
    db: Session,
    date_filter: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Calculates order counts and amounts across statuses."""
    c_start, c_end, _, _ = parse_date_filters(date_filter, start_date, end_date)

    query = db.query(
        Order.status,
        func.count(Order.id).label("count"),
        func.sum(Order.total_amount).label("total_amount")
    )
    if c_start:
        query = query.filter(Order.order_date >= c_start, Order.order_date <= c_end)
    if region and region != "All":
        query = query.filter(Order.region == region)

    rows = query.group_by(Order.status).all()
    total_orders = sum((r.count or 0) for r in rows)

    result = []
    for r in rows:
        cnt = int(r.count or 0)
        pct = round((cnt / total_orders * 100), 1) if total_orders > 0 else 0.0
        result.append({
            "status": r.status,
            "count": cnt,
            "total_amount": round(float(r.total_amount or 0.0), 2),
            "percentage": pct
        })
    return result


def compute_customer_analytics(db: Session, reference_date: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Computes full customer metrics and assigns transparent rule-based segments:
    - High Value: Total spending >= $2,000 OR (Total Orders >= 4 and spending >= $1,000)
    - Regular: Total Orders >= 2 and spending between $300 and $2,000
    - New: First order placed in the last 60 days, orders <= 1
    - At Risk: Last order was > 90 days ago OR had a Refunded order/negative feedback
    """
    ref = reference_date or datetime(2026, 11, 15, 23, 59, 59)

    customers = db.query(Customer).all()
    all_orders = db.query(Order).all()
    all_feedback = db.query(Feedback).all()

    # Map orders and feedback to customers
    cust_orders: Dict[int, List[Order]] = {c.id: [] for c in customers}
    for o in all_orders:
        if o.customer_id in cust_orders:
            cust_orders[o.customer_id].append(o)

    cust_feedback: Dict[int, List[Feedback]] = {c.id: [] for c in customers}
    for fb in all_feedback:
        if fb.customer_id in cust_feedback:
            cust_feedback[fb.customer_id].append(fb)

    customer_table = []
    segment_counts = {"High Value": 0, "Regular": 0, "New": 0, "At Risk": 0}
    segment_rev = {"High Value": 0.0, "Regular": 0.0, "New": 0.0, "At Risk": 0.0}

    new_customers_count = 0
    returning_customers_count = 0

    for c in customers:
        c_orders = cust_orders.get(c.id, [])
        comp_orders = [o for o in c_orders if o.status == "Completed"]
        total_spending = sum(o.total_amount for o in comp_orders)
        order_count = len(comp_orders)
        
        last_order_date = max([o.order_date for o in c_orders]) if c_orders else None
        days_since_last = (ref - last_order_date).days if last_order_date else 999
        days_since_created = (ref - c.created_at).days

        has_refund = any(o.status == "Refunded" for o in c_orders)
        has_negative_fb = any(fb.rating <= 2 for fb in cust_feedback.get(c.id, []))

        # Determine segment
        if total_spending >= 2000.0 or (order_count >= 4 and total_spending >= 1000.0):
            segment = "High Value"
        elif days_since_last > 90 or (order_count > 0 and (has_refund or has_negative_fb)):
            segment = "At Risk"
        elif order_count >= 2 and total_spending >= 300.0:
            segment = "Regular"
        elif days_since_created <= 60 or order_count <= 1:
            segment = "New"
        else:
            segment = "Regular"

        if order_count >= 2:
            returning_customers_count += 1
        elif order_count == 1:
            new_customers_count += 1

        segment_counts[segment] += 1
        segment_rev[segment] += total_spending

        customer_table.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "region": c.region,
            "created_at": c.created_at.strftime("%Y-%m-%d"),
            "total_orders": order_count,
            "total_spending": round(total_spending, 2),
            "customer_segment": segment,
            "last_order_date": last_order_date.strftime("%Y-%m-%d") if last_order_date else "N/A"
        })

    total_customers = len(customers)
    total_revenue = sum(c["total_spending"] for c in customer_table)
    avg_customer_spending = round(total_revenue / total_customers, 2) if total_customers > 0 else 0.0
    total_completed_orders = sum(c["total_orders"] for c in customer_table)
    purchase_frequency = round(total_completed_orders / total_customers, 2) if total_customers > 0 else 0.0

    # Segments breakdown list
    segments_summary = []
    for seg, count in segment_counts.items():
        rev = round(segment_rev[seg], 2)
        pct = round((count / total_customers * 100), 1) if total_customers > 0 else 0.0
        avg_spend = round(rev / count, 2) if count > 0 else 0.0
        segments_summary.append({
            "segment": seg,
            "count": count,
            "total_revenue": rev,
            "avg_spend": avg_spend,
            "percentage": pct
        })

    return {
        "total_customers": total_customers,
        "new_customers": new_customers_count,
        "returning_customers": returning_customers_count,
        "purchase_frequency": purchase_frequency,
        "avg_customer_spending": avg_customer_spending,
        "segments": segments_summary,
        "customers": customer_table
    }


def compute_monthly_customer_growth(db: Session) -> List[Dict[str, Any]]:
    """Calculates monthly new customer acquisitions and growth trajectory."""
    customers = db.query(Customer).order_by(Customer.created_at).all()
    if not customers:
        return []

    df = pd.DataFrame([{"created_at": c.created_at} for c in customers])
    df["month"] = df["created_at"].dt.strftime("%Y-%m")
    grouped = df.groupby("month").size().reset_index(name="new_customers")
    grouped = grouped.sort_values(by="month")

    result = []
    cumulative = 0
    prev_new = 0

    for _, row in grouped.iterrows():
        new_c = int(row["new_customers"])
        cumulative += new_c
        if prev_new > 0:
            growth_pct = round(((new_c - prev_new) / prev_new) * 100, 1)
        else:
            growth_pct = 0.0
        prev_new = new_c

        month_label = datetime.strptime(row["month"], "%Y-%m").strftime("%b %Y")
        result.append({
            "month": month_label,
            "new_customers": new_c,
            "total_customers": cumulative,
            "growth_rate_pct": growth_pct
        })
    return result


def compute_product_performance(
    db: Session,
    date_filter: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """Identifies best-selling and low-performing products with full metrics."""
    c_start, c_end, _, _ = parse_date_filters(date_filter, start_date, end_date)

    query = db.query(
        Product.id,
        Product.name,
        Product.category,
        Product.price,
        func.coalesce(func.sum(OrderItem.quantity), 0).label("units_sold"),
        func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0.0).label("total_revenue")
    ).outerjoin(OrderItem, Product.id == OrderItem.product_id)\
     .outerjoin(Order, Order.id == OrderItem.order_id)

    if c_start:
        query = query.filter((Order.order_date >= c_start) & (Order.order_date <= c_end) & (Order.status == "Completed"))
    else:
        query = query.filter((Order.status == "Completed") | (Order.status == None))

    if category and category != "All":
        query = query.filter(Product.category == category)

    query = query.group_by(Product.id, Product.name, Product.category, Product.price)
    rows = query.all()

    items = []
    for r in rows:
        items.append({
            "id": r.id,
            "name": r.name,
            "category": r.category,
            "price": float(r.price),
            "units_sold": int(r.units_sold or 0),
            "total_revenue": round(float(r.total_revenue or 0.0), 2)
        })

    # Sort to find best and low performers
    sorted_by_rev = sorted(items, key=lambda x: x["total_revenue"], reverse=True)
    best_sellers = sorted_by_rev[:5]
    low_performers = sorted_by_rev[-5:] if len(sorted_by_rev) >= 5 else sorted_by_rev

    return {
        "all_products": sorted_by_rev,
        "best_sellers": best_sellers,
        "low_performers": low_performers
    }


def compute_feedback_analytics(
    db: Session,
    date_filter: Optional[str] = "all",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    rating_filter: Optional[int] = None
) -> Dict[str, Any]:
    """Computes CSAT trends, complaint category breakdowns, and sentiment distribution."""
    c_start, c_end, _, _ = parse_date_filters(date_filter, start_date, end_date)

    query = db.query(Feedback)
    if c_start:
        query = query.filter(Feedback.created_at >= c_start, Feedback.created_at <= c_end)
    if rating_filter:
        query = query.filter(Feedback.rating == rating_filter)

    feedbacks = query.all()
    total = len(feedbacks)
    if total == 0:
        return {
            "average_rating": 0.0,
            "total_feedbacks": 0,
            "positive_percentage": 0.0,
            "negative_percentage": 0.0,
            "neutral_percentage": 0.0,
            "total_complaints": 0,
            "category_breakdown": [],
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "trend": [],
            "feedbacks": []
        }

    ratings = [f.rating for f in feedbacks]
    avg_rating = round(sum(ratings) / total, 2)
    positives = sum(1 for r in ratings if r >= 4)
    neutrals = sum(1 for r in ratings if r == 3)
    negatives = sum(1 for r in ratings if r <= 2)

    pos_pct = round((positives / total) * 100, 1)
    neu_pct = round((neutrals / total) * 100, 1)
    neg_pct = round((negatives / total) * 100, 1)

    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in ratings:
        rating_dist[r] = rating_dist.get(r, 0) + 1

    # Category breakdown for complaints (ratings <= 3)
    complaints = [f for f in feedbacks if f.rating <= 2]
    total_complaints = len(complaints)

    cat_map: Dict[str, int] = {}
    for f in complaints:
        cat_map[f.category] = cat_map.get(f.category, 0) + 1

    category_breakdown = [
        {"category": k, "complaints_count": v, "percentage": round((v / total_complaints * 100), 1) if total_complaints > 0 else 0.0}
        for k, v in sorted(cat_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # Feedback trend by month
    trend_map: Dict[str, List[int]] = {}
    for f in feedbacks:
        m = f.created_at.strftime("%Y-%m")
        trend_map.setdefault(m, []).append(f.rating)

    trend = []
    for m in sorted(trend_map.keys()):
        m_ratings = trend_map[m]
        trend.append({
            "month": datetime.strptime(m, "%Y-%m").strftime("%b %Y"),
            "average_rating": round(sum(m_ratings) / len(m_ratings), 2),
            "review_count": len(m_ratings)
        })

    # Return feedback item list
    feedback_items = []
    for f in feedbacks:
        sentiment = "Positive" if f.rating >= 4 else ("Neutral" if f.rating == 3 else "Negative")
        feedback_items.append({
            "id": f.id,
            "customer_id": f.customer_id,
            "customer_name": f.customer.name if f.customer else f"Customer #{f.customer_id}",
            "rating": f.rating,
            "comment": f.comment,
            "category": f.category,
            "sentiment": sentiment,
            "created_at": f.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return {
        "average_rating": avg_rating,
        "total_feedbacks": total,
        "positive_percentage": pos_pct,
        "negative_percentage": neg_pct,
        "neutral_percentage": neu_pct,
        "total_complaints": total_complaints,
        "category_breakdown": category_breakdown,
        "rating_distribution": rating_dist,
        "trend": trend,
        "feedbacks": feedback_items
    }
