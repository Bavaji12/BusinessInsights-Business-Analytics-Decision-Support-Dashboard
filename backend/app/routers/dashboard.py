from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import DashboardSummary
from app.analytics.metrics import (
    compute_dashboard_summary,
    compute_order_status_distribution,
    compute_monthly_customer_growth
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    date_filter: Optional[str] = Query("30d", description="7d, 30d, 90d, 1y, all, custom"),
    start_date: Optional[str] = Query(None, description="Start date for custom filter (ISO string)"),
    end_date: Optional[str] = Query(None, description="End date for custom filter (ISO string)"),
    region: Optional[str] = Query(None, description="Filter by region (All, North, South, etc.)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    """Returns top-level business KPI metrics with period-over-period comparisons."""
    return compute_dashboard_summary(
        db,
        date_filter=date_filter,
        start_date=start_date,
        end_date=end_date,
        region=region,
        category=category
    )

@router.get("/order-status")
def get_order_status_distribution(
    date_filter: Optional[str] = Query("30d"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns distribution of orders by fulfillment status."""
    return compute_order_status_distribution(
        db,
        date_filter=date_filter,
        start_date=start_date,
        end_date=end_date,
        region=region
    )

@router.get("/customer-growth")
def get_customer_growth(db: Session = Depends(get_db)):
    """Returns monthly new customer acquisition numbers and growth rates."""
    return compute_monthly_customer_growth(db)
