from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.analytics.metrics import compute_customer_analytics

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("")
def get_customers(
    search: Optional[str] = Query(None, description="Search by customer name or email"),
    region: Optional[str] = Query(None, description="Filter by region"),
    segment: Optional[str] = Query(None, description="Filter by segment: High Value, Regular, New, At Risk"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Returns full customer analytics metrics, segmentation breakdown, and customer table."""
    full_data = compute_customer_analytics(db)
    customers = full_data["customers"]

    # Filter by region
    if region and region != "All":
        customers = [c for c in customers if c["region"] == region]

    # Filter by segment
    if segment and segment != "All":
        customers = [c for c in customers if c["customer_segment"] == segment]

    # Search filter
    if search:
        s = search.strip().lower()
        customers = [c for c in customers if s in c["name"].lower() or s in c["email"].lower() or str(c["id"]) == s]

    total_filtered = len(customers)
    total_pages = (total_filtered + page_size - 1) // page_size if total_filtered > 0 else 1
    offset = (page - 1) * page_size
    paginated_customers = customers[offset:offset + page_size]

    return {
        "summary": {
            "total_customers": full_data["total_customers"],
            "new_customers": full_data["new_customers"],
            "returning_customers": full_data["returning_customers"],
            "purchase_frequency": full_data["purchase_frequency"],
            "avg_customer_spending": full_data["avg_customer_spending"],
            "segments": full_data["segments"]
        },
        "customers": paginated_customers,
        "total_records": total_filtered,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
