from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Customer, Product, Order, OrderItem, Feedback
from app.analytics.metrics import (
    compute_dashboard_summary,
    compute_regional_performance,
    compute_product_performance,
    compute_feedback_analytics,
    compute_customer_analytics
)

def evaluate_business_insights(db: Session, reference_date: datetime = None) -> List[Dict[str, Any]]:
    """
    Evaluates real mathematical and statistical rules against the database.
    Generates structured, data-backed business problem statements.
    """
    ref = reference_date or datetime(2026, 11, 15, 23, 59, 59)
    insights = []

    # ---------------------------------------------------------
    # RULE 1: Revenue Decline Analysis (MoM / Period-over-Period)
    # ---------------------------------------------------------
    summary_30d = compute_dashboard_summary(db, date_filter="30d", reference_date=ref)
    rev_growth = summary_30d["revenue_growth_pct"]
    current_rev = summary_30d["total_revenue"]
    aov = summary_30d["average_order_value"]

    if rev_growth < -2.0 or current_rev == 0:
        drop_abs = abs(rev_growth)
        priority = "High" if drop_abs >= 10.0 else "Medium"
        insights.append({
            "id": "INSIGHT-REV-01",
            "category": "Revenue Decline",
            "title": f"Monthly Revenue Contraction of {drop_abs}% Detected",
            "priority": priority,
            "metric_value": current_rev,
            "benchmark_value": round(current_rev / (1 + (rev_growth / 100)), 2) if (1 + (rev_growth / 100)) > 0 else current_rev,
            "description": (
                f"Completed sales revenue in the last 30-day billing cycle fell by {drop_abs}% "
                f"relative to the previous 30-day baseline. Current period revenue is ${current_rev:,.2f} with an AOV of ${aov:,.2f}."
            ),
            "supporting_data": {
                "period_revenue": current_rev,
                "revenue_growth_pct": rev_growth,
                "average_order_value": aov,
                "total_orders": summary_30d["total_orders"],
                "active_customers": summary_30d["active_customers"]
            },
            "business_impact": (
                "Cash flow contraction, reduced gross margin absorption, and potential top-line revenue shortfall "
                "against quarterly operational targets."
            ),
            "recommended_action": (
                "Conduct an immediate diagnostic on checkout funnel drop-offs, review discount pricing elasticity, "
                "and deploy targeted re-engagement campaigns to mid-tier lapsed buyers."
            )
        })
    else:
        # Stable or growing revenue insight
        insights.append({
            "id": "INSIGHT-REV-01",
            "category": "Revenue Performance",
            "title": f"Positive Revenue Expansion (+{rev_growth}%)",
            "priority": "Low",
            "metric_value": current_rev,
            "benchmark_value": round(current_rev / (1 + (rev_growth / 100)), 2) if (1 + (rev_growth / 100)) > 0 else current_rev,
            "description": (
                f"Sales revenue expanded by {rev_growth}% in the recent period reaching ${current_rev:,.2f}. "
                f"Average Order Value held steady at ${aov:,.2f}."
            ),
            "supporting_data": {
                "period_revenue": current_rev,
                "revenue_growth_pct": rev_growth,
                "average_order_value": aov,
                "total_orders": summary_30d["total_orders"]
            },
            "business_impact": "Healthy top-line momentum; positive working capital reserves.",
            "recommended_action": "Capitalize on momentum by scaling inventory for high-velocity product lines and expanding paid acquisition channels."
        })

    # ---------------------------------------------------------
    # RULE 2: Customer Satisfaction & Complaint Surge
    # ---------------------------------------------------------
    fb_data = compute_feedback_analytics(db, date_filter="all")
    avg_csat = fb_data["average_rating"]
    neg_pct = fb_data["negative_percentage"]
    total_complaints = fb_data["total_complaints"]
    cat_breakdown = fb_data["category_breakdown"]

    top_complaint_category = cat_breakdown[0]["category"] if cat_breakdown else "General"
    top_complaint_pct = cat_breakdown[0]["percentage"] if cat_breakdown else 0.0

    if avg_csat < 3.8 or neg_pct > 15.0 or total_complaints >= 10:
        priority = "High" if (avg_csat < 3.2 or neg_pct > 25.0) else "Medium"
        insights.append({
            "id": "INSIGHT-CSAT-02",
            "category": "Customer Satisfaction",
            "title": f"Customer Complaints Concentration in '{top_complaint_category}' ({top_complaint_pct}%)",
            "priority": priority,
            "metric_value": avg_csat,
            "benchmark_value": 4.5,
            "description": (
                f"Customer satisfaction stands at {avg_csat}/5.0 with {neg_pct}% of total reviews categorized as negative (ratings 1-2). "
                f"A significant concentration of customer dissatisfaction ({top_complaint_pct}%) is linked directly to '{top_complaint_category}' issues."
            ),
            "supporting_data": {
                "average_csat": avg_csat,
                "target_csat": 4.5,
                "negative_feedback_pct": neg_pct,
                "total_complaints": total_complaints,
                "primary_issue_category": top_complaint_category,
                "issue_percentage": top_complaint_pct
            },
            "business_impact": (
                "Erosion of Net Promoter Score (NPS), elevated post-sale support costs, higher refund volumes, "
                "and negative customer word-of-mouth impairing customer lifetime value (LTV)."
            ),
            "recommended_action": (
                f"Initiate a quality audit specifically targeting the '{top_complaint_category}' workflow. "
                "Enforce strict 24-hour turnaround SLAs for unresolved complaints and establish a proactive customer recovery outreach protocol."
            )
        })

    # ---------------------------------------------------------
    # RULE 3: Consistently Low-Performing / Stagnant Products
    # ---------------------------------------------------------
    prod_data = compute_product_performance(db, date_filter="all")
    low_prods = prod_data["low_performers"]
    best_prods = prod_data["best_sellers"]

    top_revenue = best_prods[0]["total_revenue"] if best_prods else 1.0
    stagnant_items = [p for p in low_prods if p["total_revenue"] < (0.10 * top_revenue)]

    if stagnant_items:
        names = ", ".join([f"'{p['name']}' (${p['total_revenue']:,.0f})" for p in stagnant_items[:3]])
        insights.append({
            "id": "INSIGHT-PROD-03",
            "category": "Product Performance",
            "title": f"Inventory Drag: {len(stagnant_items)} Products Generating Sub-10% Revenue",
            "priority": "Medium",
            "metric_value": stagnant_items[0]["total_revenue"],
            "benchmark_value": top_revenue,
            "description": (
                f"Identified multiple underperforming catalog items including {names} with minimal order volume. "
                f"The highest selling product generated ${top_revenue:,.2f}, showing a heavy revenue skew."
            ),
            "supporting_data": {
                "underperforming_products_count": len(stagnant_items),
                "stagnant_sample": [p["name"] for p in stagnant_items[:3]],
                "top_product_name": best_prods[0]["name"] if best_prods else "N/A",
                "top_product_revenue": top_revenue
            },
            "business_impact": (
                "Working capital locked in slow-moving inventory, warehouse storage fees, and cannibalization of merchandising space."
            ),
            "recommended_action": (
                "Execute an end-of-quarter clearance bundle linking low-velocity SKUs with best-selling products. "
                "If velocity does not recover within 60 days, discontinue replenishment to free operational capital."
            )
        })

    # ---------------------------------------------------------
    # RULE 4: Regional Performance Disparity
    # ---------------------------------------------------------
    regional_data = compute_regional_performance(db, date_filter="all")
    if len(regional_data) >= 2:
        top_region = regional_data[0]
        lowest_region = regional_data[-1]

        disparity_ratio = round(top_region["revenue"] / (lowest_region["revenue"] if lowest_region["revenue"] > 0 else 1.0), 1)

        if lowest_region["percentage"] < 15.0 or disparity_ratio >= 1.8:
            insights.append({
                "id": "INSIGHT-REG-04",
                "category": "Regional Disparity",
                "title": f"Under-Penetration in '{lowest_region['region']}' ({lowest_region['percentage']}% of Total Sales)",
                "priority": "Medium",
                "metric_value": lowest_region["revenue"],
                "benchmark_value": top_region["revenue"],
                "description": (
                    f"'{lowest_region['region']}' accounts for only {lowest_region['percentage']}% (${lowest_region['revenue']:,.2f}) "
                    f"of total business revenue, while '{top_region['region']}' leads with {top_region['percentage']}% (${top_region['revenue']:,.2f}), "
                    f"revealing a {disparity_ratio}x regional disparity."
                ),
                "supporting_data": {
                    "lowest_region": lowest_region["region"],
                    "lowest_region_revenue": lowest_region["revenue"],
                    "lowest_region_orders": lowest_region["orders_count"],
                    "top_region": top_region["region"],
                    "top_region_revenue": top_region["revenue"],
                    "disparity_ratio": f"{disparity_ratio}x"
                },
                "business_impact": (
                    "Over-reliance on a single geographic market increases business vulnerability to localized shocks. "
                    "Untapped market share in the lagging region represents an unrealized growth opportunity."
                ),
                "recommended_action": (
                    f"Study the channel mix and buyer profile in '{top_region['region']}' to adapt localized promotional offers "
                    f"and partner networks in '{lowest_region['region']}'."
                )
            })

    # ---------------------------------------------------------
    # RULE 5: Customer Retention & Churn Risk
    # ---------------------------------------------------------
    cust_data = compute_customer_analytics(db)
    segments = {s["segment"]: s for s in cust_data["segments"]}
    at_risk = segments.get("At Risk", {"count": 0, "percentage": 0.0, "total_revenue": 0.0})
    high_val = segments.get("High Value", {"count": 0, "percentage": 0.0, "total_revenue": 0.0})

    if at_risk["percentage"] >= 15.0:
        priority = "High" if at_risk["percentage"] >= 25.0 else "Medium"
        insights.append({
            "id": "INSIGHT-CHURN-05",
            "category": "Customer Churn Risk",
            "title": f"{at_risk['percentage']}% of Customer Base Categorized as 'At Risk'",
            "priority": priority,
            "metric_value": at_risk["count"],
            "benchmark_value": cust_data["total_customers"],
            "description": (
                f"{at_risk['count']} customers ({at_risk['percentage']}% of the total customer base) have become dormant (>90 days without an order) "
                f"or have previously logged service dissatisfaction / refunds. These accounts historically accounted for ${at_risk['total_revenue']:,.2f} in revenue."
            ),
            "supporting_data": {
                "at_risk_count": at_risk["count"],
                "at_risk_percentage": at_risk["percentage"],
                "historical_revenue_at_stake": at_risk["total_revenue"],
                "high_value_accounts_count": high_val["count"]
            },
            "business_impact": (
                "Accelerated customer churn increases reliance on high-cost customer acquisition, compressing overall customer lifetime value (LTV:CAC ratio)."
            ),
            "recommended_action": (
                "Deploy a multi-touch automated win-back sequence offering tiered VIP loyalty incentives and direct account manager check-ins."
            )
        })

    return insights


def generate_actionable_recommendations(db: Session) -> List[Dict[str, Any]]:
    """
    Synthesizes each business insight into a concrete, prioritized operational action plan
    with department assignments and expected impact.
    """
    insights = evaluate_business_insights(db)
    recommendations = []

    for idx, ins in enumerate(insights, 1):
        cat = ins["category"]
        ins_id = ins["id"]

        if "Revenue" in cat:
            recommendations.append({
                "id": f"REC-{idx:02d}",
                "title": "Dynamic Pricing & Funnel Optimization Initiative",
                "problem_ref": ins["title"],
                "insight_id": ins_id,
                "priority": ins["priority"],
                "department": "Sales & Marketing",
                "effort": "Quick Win",
                "expected_impact": "+8% to +14% lift in monthly conversion rate within 45 days",
                "action_plan": [
                    "Audit abandoned cart touchpoints and configure automated 2-hour recovery emails.",
                    "Implement tiered volume discounts (e.g. 10% off on orders exceeding $350).",
                    "A/B test product landing page headlines and social proof badges.",
                    "Review supplier cost sheets to protect gross margin floor."
                ]
            })
        elif "Customer Satisfaction" in cat:
            recommendations.append({
                "id": f"REC-{idx:02d}",
                "title": "Logistics & Customer Experience SLA Overhaul",
                "problem_ref": ins["title"],
                "insight_id": ins_id,
                "priority": ins["priority"],
                "department": "Customer Support & Operations",
                "effort": "Medium Effort",
                "expected_impact": "Reduce negative feedback rate to <8% and raise CSAT to >4.3/5.0",
                "action_plan": [
                    "Convene weekly SLA review with 3PL carrier partners regarding dispatch punctuality.",
                    "Establish live chat routing priority for customers filing delivery or defect tickets.",
                    "Issue automated $15 courtesy vouchers to any customer experiencing a shipping delay over 48 hours.",
                    "Update packaging specifications for fragile hardware to minimize transit damage."
                ]
            })
        elif "Product Performance" in cat:
            recommendations.append({
                "id": f"REC-{idx:02d}",
                "title": "Catalog Rationalization & Cross-Sell Bundling",
                "problem_ref": ins["title"],
                "insight_id": ins_id,
                "priority": ins["priority"],
                "department": "Product & Merchandising",
                "effort": "Quick Win",
                "expected_impact": "Liquidate $12,000+ in stagnant inventory and reduce inventory holding cost by 18%",
                "action_plan": [
                    "Bundle slow-moving accessories (e.g., cable trays, staplers) with high-volume monitors and standing desks.",
                    "Feature curated 'Complete Home Office' bundles on the homepage at an attractive combined price.",
                    "Set 90-day liquidation deadlines before deprecating non-profitable SKUs.",
                    "Reallocate procurement budget toward high-margin software licenses and ergonomic seating."
                ]
            })
        elif "Regional Disparity" in cat:
            recommendations.append({
                "id": f"REC-{idx:02d}",
                "title": "Regional Expansion Playbook & Localized Partnerships",
                "problem_ref": ins["title"],
                "insight_id": ins_id,
                "priority": ins["priority"],
                "department": "Sales Strategy & Regional BD",
                "effort": "Strategic Project",
                "expected_impact": "Increase lagging region revenue contribution from <15% to 22%+ over 2 quarters",
                "action_plan": [
                    "Analyze high-converting corporate accounts in the top region and target similar profiles in the lagging region.",
                    "Partner with regional logistics hubs to reduce regional shipping times from 5 days to 2 days.",
                    "Run localized digital advertising highlighting fast local fulfillment.",
                    "Recruit 2 dedicated regional account representatives for enterprise outreach."
                ]
            })
        elif "Customer Churn Risk" in cat:
            recommendations.append({
                "id": f"REC-{idx:02d}",
                "title": "Automated Retention Engine & VIP Re-engagement Program",
                "problem_ref": ins["title"],
                "insight_id": ins_id,
                "priority": ins["priority"],
                "department": "Customer Success & CRM",
                "effort": "Medium Effort",
                "expected_impact": "Reactivate 20% to 28% of dormant accounts; safeguard ~$8,500 in recurring revenue",
                "action_plan": [
                    "Segment at-risk buyers by historical spend and trigger customized 3-part win-back email sequences.",
                    "Offer high-value dormant accounts a dedicated 1-on-1 account review or tailored product demo.",
                    "Institute quarterly health checks for corporate clients with order gaps >60 days.",
                    "Introduce a loyalty points program rewarding repeat purchases within 45 days."
                ]
            })

    return recommendations
