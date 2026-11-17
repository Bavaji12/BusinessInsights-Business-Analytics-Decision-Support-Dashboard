import pytest
from app.analytics.metrics import (
    parse_date_filters,
    compute_dashboard_summary,
    compute_revenue_trend,
    compute_category_sales,
    compute_regional_performance,
    compute_customer_analytics
)
from app.database import SessionLocal

def test_date_parser_filters():
    c_start, c_end, p_start, p_end = parse_date_filters("30d")
    assert c_start is not None
    assert c_end is not None
    assert (c_end - c_start).days == 30
    assert p_start is not None
    assert (p_end - p_start).days == 30

def test_zero_denominator_safety():
    """Ensure calculations never fail even on empty queries."""
    db = SessionLocal()
    try:
        # Filter for impossible date in future
        summary = compute_dashboard_summary(db, date_filter="custom", start_date="2099-01-01", end_date="2099-01-02")
        assert summary["total_revenue"] == 0.0
        assert summary["total_orders"] == 0
        assert summary["average_order_value"] == 0.0
        assert summary["revenue_growth_pct"] == 0.0
    finally:
        db.close()

def test_customer_segment_assignment():
    """Verify segments are assigned accurately according to business rules."""
    db = SessionLocal()
    try:
        data = compute_customer_analytics(db)
        segments = {s["segment"]: s for s in data["segments"]}
        assert "High Value" in segments
        assert "Regular" in segments
        assert "New" in segments
        assert "At Risk" in segments
        total_pct = sum(s["percentage"] for s in data["segments"])
        assert 99.0 <= total_pct <= 101.0
    finally:
        db.close()
