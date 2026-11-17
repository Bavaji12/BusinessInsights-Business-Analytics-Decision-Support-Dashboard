from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import BusinessInsightItem, RecommendationItem
from app.analytics.insights_engine import (
    evaluate_business_insights,
    generate_actionable_recommendations
)

router = APIRouter(tags=["Insights & Recommendations"])

@router.get("/api/insights", response_model=List[BusinessInsightItem])
def get_business_insights(db: Session = Depends(get_db)):
    """
    Evaluates real mathematical and statistical rules against the database
    to detect business bottlenecks, revenue drops, regional disparities, CSAT issues, etc.
    """
    return evaluate_business_insights(db)

@router.get("/api/recommendations", response_model=List[RecommendationItem])
def get_recommendations(db: Session = Depends(get_db)):
    """
    Returns prioritized operational actions, timelines, and department assignments
    tied directly to identified business problems.
    """
    return generate_actionable_recommendations(db)
