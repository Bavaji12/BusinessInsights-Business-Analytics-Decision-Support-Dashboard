from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models import Order, Customer, OrderItem, Product
from app.analytics.metrics import parse_date_filters

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.get("")
def get_orders(
    search: Optional[str] = Query(None, description="Search by Order ID or Customer Name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    region: Optional[str] = Query(None, description="Filter by region"),
    status: Optional[str] = Query(None, description="Filter by status (Completed, Processing, Cancelled, Refunded)"),
    sort_by: Optional[str] = Query("order_date", description="order_date or total_amount"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    date_filter: Optional[str] = Query("all"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Returns filtered, sorted, paginated sales transactions with total sales and AOV KPIs."""
    query = db.query(Order).join(Customer, Order.customer_id == Customer.id)

    # Date filter
    c_start, c_end, _, _ = parse_date_filters(date_filter, start_date, end_date)
    if c_start:
        query = query.filter(Order.order_date >= c_start, Order.order_date <= c_end)

    # Region filter
    if region and region != "All":
        query = query.filter(Order.region == region)

    # Status filter
    if status and status != "All":
        query = query.filter(Order.status == status)

    # Category filter
    if category and category != "All":
        query = query.join(OrderItem, Order.id == OrderItem.order_id)\
                     .join(Product, OrderItem.product_id == Product.id)\
                     .filter(Product.category == category)

    # Search filter (Order ID or Customer Name)
    if search:
        search_term = f"%{search.strip()}%"
        if search.strip().isdigit():
            query = query.filter((Order.id == int(search.strip())) | (Customer.name.ilike(search_term)))
        else:
            query = query.filter(Customer.name.ilike(search_term))

    query = query.distinct()

    # Pre-pagination totals for summary cards
    all_matching = query.all()
    total_matching_orders = len(all_matching)
    completed_matching = [o for o in all_matching if o.status == "Completed"]
    total_sales_amount = round(sum(o.total_amount for o in completed_matching), 2)
    avg_order_val = round(total_sales_amount / len(completed_matching), 2) if completed_matching else 0.0

    # Sorting
    sort_column = Order.total_amount if sort_by == "total_amount" else Order.order_date
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Pagination
    total_pages = (total_matching_orders + page_size - 1) // page_size if total_matching_orders > 0 else 1
    offset = (page - 1) * page_size
    orders_page = query.offset(offset).limit(page_size).all()

    items_out = []
    for o in orders_page:
        items_out.append({
            "id": o.id,
            "customer_id": o.customer_id,
            "customer_name": o.customer.name if o.customer else f"Customer #{o.customer_id}",
            "customer_email": o.customer.email if o.customer else "",
            "order_date": o.order_date.strftime("%Y-%m-%d %H:%M"),
            "total_amount": o.total_amount,
            "status": o.status,
            "region": o.region,
            "items_count": len(o.items),
            "item_categories": list(set(it.product.category for it in o.items if it.product))
        })

    return {
        "orders": items_out,
        "total_records": total_matching_orders,
        "total_sales": total_sales_amount,
        "average_order_value": avg_order_val,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/{order_id}")
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    """Returns detailed order information including line items."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"error": "Order not found"}
    
    line_items = []
    for item in order.items:
        line_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else f"Product #{item.product_id}",
            "category": item.product.category if item.product else "N/A",
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total": round(item.quantity * item.unit_price, 2)
        })

    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.name if order.customer else "N/A",
        "customer_email": order.customer.email if order.customer else "N/A",
        "order_date": order.order_date.strftime("%Y-%m-%d %H:%M:%S"),
        "total_amount": order.total_amount,
        "status": order.status,
        "region": order.region,
        "items": line_items
    }
