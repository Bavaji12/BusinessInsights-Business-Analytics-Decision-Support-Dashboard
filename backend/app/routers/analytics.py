from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.schemas import (
    RevenueTrendPoint,
    CategorySalesPoint,
    RegionRevenuePoint,
    CustomerSegmentPoint
)
from app.analytics.metrics import (
    compute_revenue_trend,
    compute_category_sales,
    compute_regional_performance,
    compute_customer_analytics,
    compute_product_performance
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/revenue", response_model=List[RevenueTrendPoint])
def get_revenue_trend(
    date_filter: Optional[str] = Query("30d"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns revenue trend over time based on date filters."""
    return compute_revenue_trend(
        db,
        date_filter=date_filter,
        start_date=start_date,
        end_date=end_date,
        region=region
    )

@router.get("/products")
def get_product_analytics(
    date_filter: Optional[str] = Query("30d"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns sales grouped by Category, plus best-sellers and low-performing products."""
    categories = compute_category_sales(
        db,
        date_filter=date_filter,
        start_date=start_date,
        end_date=end_date
    )
    performance = compute_product_performance(
        db,
        date_filter=date_filter,
        start_date=start_date,
        end_date=end_date,
        category=category
    )
    return {
        "by_category": categories,
        "best_sellers": performance["best_sellers"],
        "low_performers": performance["low_performers"],
        "all_products": performance["all_products"]
    }

@router.get("/regions", response_model=List[RegionRevenuePoint])
def get_regional_analytics(
    date_filter: Optional[str] = Query("30d"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns revenue, order volumes, and customer distribution across regions."""
    return compute_regional_performance(
        db,
        date_filter=date_filter,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/customers")
def get_customer_analytics_summary(db: Session = Depends(get_db)):
    """Returns customer acquisition, retention, and segmentation analytics."""
    data = compute_customer_analytics(db)
    return {
        "total_customers": data["total_customers"],
        "new_customers": data["new_customers"],
        "returning_customers": data["returning_customers"],
        "purchase_frequency": data["purchase_frequency"],
        "avg_customer_spending": data["avg_customer_spending"],
        "segments": data["segments"]
    }
