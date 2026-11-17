from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.database import engine, Base, SessionLocal
from app.seed_data import generate_sample_data
from app.models import Customer
from app.routers import (
    dashboard,
    analytics,
    insights,
    orders,
    customers,
    feedback,
    data_mgmt
)

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database has initial sample data
    db = SessionLocal()
    try:
        cust_count = db.query(Customer).count()
        if cust_count == 0:
            print("No data found in database. Initializing realistic sample data...")
            generate_sample_data(db, force_reset=False)
            print("Sample data populated successfully.")
    except Exception as e:
        print(f"Startup check failed: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="BusinessInsights – Business Analytics & Decision Support API",
    description="REST API for Business Analytics, Sales Performance, Customer Segmentation, and Data-Driven Decision Support.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(orders.router)
app.include_router(customers.router)
app.include_router(feedback.router)
app.include_router(data_mgmt.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BusinessInsights API",
        "version": "1.0.0"
    }
