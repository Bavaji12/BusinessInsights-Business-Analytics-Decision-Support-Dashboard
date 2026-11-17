from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Base & Response Schemas

class CustomerBase(BaseModel):
    name: str
    email: str
    region: str

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    total_orders: Optional[int] = 0
    total_spending: Optional[float] = 0.0
    customer_segment: Optional[str] = "New"
    last_order_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str
    category: str
    price: float

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    total_units_sold: Optional[int] = 0
    total_revenue: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemOut(OrderItemBase):
    id: int
    order_id: int
    product_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    customer_id: int
    order_date: Optional[datetime] = None
    total_amount: float
    status: str = "Completed"
    region: str

class OrderCreate(OrderBase):
    items: Optional[List[OrderItemCreate]] = []

class OrderOut(OrderBase):
    id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    items: Optional[List[OrderItemOut]] = []

    model_config = ConfigDict(from_attributes=True)


class FeedbackBase(BaseModel):
    customer_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    category: str

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackOut(FeedbackBase):
    id: int
    created_at: datetime
    customer_name: Optional[str] = None
    sentiment: Optional[str] = "Positive"

    model_config = ConfigDict(from_attributes=True)


# Analytics Schemas

class DashboardSummary(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    average_order_value: float
    revenue_growth_pct: float
    customer_satisfaction_score: float
    active_customers: int
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    filter_applied: Optional[str] = "all"


class RevenueTrendPoint(BaseModel):
    period: str # "2025-01", "2025-W02", or "2025-01-15"
    date_label: str
    revenue: float
    orders_count: int
    avg_order_value: float


class CategorySalesPoint(BaseModel):
    category: str
    total_revenue: float
    units_sold: int
    orders_count: int
    percentage: float


class RegionRevenuePoint(BaseModel):
    region: str
    revenue: float
    orders_count: int
    customer_count: int
    percentage: float


class CustomerSegmentPoint(BaseModel):
    segment: str
    count: int
    total_revenue: float
    avg_spend: float
    percentage: float


class OrderStatusPoint(BaseModel):
    status: str
    count: int
    total_amount: float
    percentage: float


class MonthlyCustomerGrowthPoint(BaseModel):
    month: str
    new_customers: int
    total_customers: int
    growth_rate_pct: float


class BusinessInsightItem(BaseModel):
    id: str
    title: str
    description: str
    supporting_data: Dict[str, Any]
    business_impact: str
    recommended_action: str
    priority: str # "High", "Medium", "Low"
    category: str # "Revenue", "Customer Satisfaction", "Product Performance", "Regional Disparity", "Customer Churn"
    metric_value: Optional[float] = None
    benchmark_value: Optional[float] = None


class RecommendationItem(BaseModel):
    id: str
    title: str
    problem_ref: str
    action_plan: List[str]
    expected_impact: str
    effort: str # "Quick Win", "Medium Effort", "Strategic Project"
    priority: str
    department: str # "Sales", "Marketing", "Customer Success", "Supply Chain", "Product"


class FeedbackSummary(BaseModel):
    average_rating: float
    total_feedbacks: int
    positive_percentage: float
    negative_percentage: float
    neutral_percentage: float
    total_complaints: int
    category_breakdown: List[Dict[str, Any]]
    rating_distribution: Dict[int, int]
    trend: List[Dict[str, Any]]


class DataValidationResult(BaseModel):
    valid: bool
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    missing_value_errors: List[Dict[str, Any]]
    schema_errors: List[str]
    preview_data: List[Dict[str, Any]]
