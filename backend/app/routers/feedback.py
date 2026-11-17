from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Feedback, Customer
from app.schemas import FeedbackCreate
from app.analytics.metrics import compute_feedback_analytics

router = APIRouter(prefix="/api/feedback", tags=["Customer Feedback"])

@router.get("")
def get_feedback(
    rating: Optional[int] = Query(None, ge=1, le=5, description="Filter by star rating (1-5)"),
    category: Optional[str] = Query(None, description="Filter by feedback category"),
    sentiment: Optional[str] = Query(None, description="Positive, Neutral, Negative"),
    search: Optional[str] = Query(None, description="Search comment or customer name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Returns overall feedback analytics and filtered list of customer feedback entries."""
    analytics = compute_feedback_analytics(db, rating_filter=rating)
    all_fb = analytics["feedbacks"]

    # Category filter
    if category and category != "All":
        all_fb = [f for f in all_fb if f["category"] == category]

    # Sentiment filter
    if sentiment and sentiment != "All":
        all_fb = [f for f in all_fb if f["sentiment"] == sentiment]

    # Search filter
    if search:
        s = search.strip().lower()
        all_fb = [f for f in all_fb if (f["comment"] and s in f["comment"].lower()) or (f["customer_name"] and s in f["customer_name"].lower())]

    total_filtered = len(all_fb)
    total_pages = (total_filtered + page_size - 1) // page_size if total_filtered > 0 else 1
    offset = (page - 1) * page_size
    paginated_items = all_fb[offset:offset + page_size]

    return {
        "summary": {
            "average_rating": analytics["average_rating"],
            "total_feedbacks": analytics["total_feedbacks"],
            "positive_percentage": analytics["positive_percentage"],
            "negative_percentage": analytics["negative_percentage"],
            "neutral_percentage": analytics["neutral_percentage"],
            "total_complaints": analytics["total_complaints"],
            "category_breakdown": analytics["category_breakdown"],
            "rating_distribution": analytics["rating_distribution"],
            "trend": analytics["trend"]
        },
        "feedbacks": paginated_items,
        "total_records": total_filtered,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.post("")
def create_feedback(feedback_in: FeedbackCreate, db: Session = Depends(get_db)):
    """Allows submitting new customer feedback."""
    customer = db.query(Customer).filter(Customer.id == feedback_in.customer_id).first()
    if not customer:
        return {"error": "Customer not found"}

    fb = Feedback(
        customer_id=feedback_in.customer_id,
        rating=feedback_in.rating,
        comment=feedback_in.comment,
        category=feedback_in.category
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    return {
        "status": "success",
        "message": "Feedback submitted successfully",
        "feedback_id": fb.id
    }
