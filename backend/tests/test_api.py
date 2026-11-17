import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary?date_filter=all")
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "total_orders" in data
    assert "total_customers" in data
    assert "average_order_value" in data
    assert "customer_satisfaction_score" in data
    assert data["total_revenue"] > 0
    assert data["total_orders"] > 0

def test_revenue_analytics():
    response = client.get("/api/analytics/revenue?date_filter=all")
    assert response.status_code == 200
    points = response.json()
    assert isinstance(points, list)
    assert len(points) > 0
    assert "revenue" in points[0]
    assert "period" in points[0]

def test_products_analytics():
    response = client.get("/api/analytics/products?date_filter=all")
    assert response.status_code == 200
    data = response.json()
    assert "by_category" in data
    assert "best_sellers" in data
    assert "low_performers" in data
    assert len(data["best_sellers"]) > 0

def test_regions_analytics():
    response = client.get("/api/analytics/regions?date_filter=all")
    assert response.status_code == 200
    regions = response.json()
    assert isinstance(regions, list)
    assert len(regions) > 0
    assert "revenue" in regions[0]
    assert "region" in regions[0]

def test_business_insights():
    response = client.get("/api/insights")
    assert response.status_code == 200
    insights = response.json()
    assert isinstance(insights, list)
    assert len(insights) > 0
    first = insights[0]
    assert "title" in first
    assert "description" in first
    assert "business_impact" in first
    assert "recommended_action" in first
    assert "priority" in first
    assert first["priority"] in ["High", "Medium", "Low"]

def test_recommendations():
    response = client.get("/api/recommendations")
    assert response.status_code == 200
    recs = response.json()
    assert isinstance(recs, list)
    assert len(recs) > 0
    first = recs[0]
    assert "action_plan" in first
    assert "expected_impact" in first
    assert "department" in first

def test_orders_filtering_and_pagination():
    response = client.get("/api/orders?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "orders" in data
    assert "total_records" in data
    assert "total_sales" in data
    assert "average_order_value" in data
    assert len(data["orders"]) <= 10

def test_customers_segmentation():
    response = client.get("/api/customers?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "segments" in data["summary"]
    assert "customers" in data
    assert len(data["customers"]) <= 10
    first_cust = data["customers"][0]
    assert "customer_segment" in first_cust

def test_feedback_analytics():
    response = client.get("/api/feedback")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "average_rating" in data["summary"]
    assert "positive_percentage" in data["summary"]
    assert "feedbacks" in data

def test_export_orders_csv():
    response = client.get("/api/data/export?entity=orders")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "OrderID" in response.text
