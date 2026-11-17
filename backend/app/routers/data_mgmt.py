import io
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
from app.database import get_db, engine, Base
from app.models import Customer, Product, Order, OrderItem, Feedback
from app.seed_data import generate_sample_data
from app.config import DATA_DIR
from app.analytics.metrics import compute_customer_analytics
from app.analytics.insights_engine import evaluate_business_insights, generate_actionable_recommendations

router = APIRouter(prefix="/api/data", tags=["Data Management"])

REQUIRED_COLUMNS = {
    "customers": ["name", "email", "region"],
    "products": ["name", "category", "price"],
    "orders": ["customer_id", "total_amount", "status", "region"],
    "feedback": ["customer_id", "rating", "category"]
}

@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    entity_type: str = Form(..., description="customers, products, orders, or feedback"),
    commit: bool = Form(False, description="If true, writes valid rows to DB. If false, only validates & previews."),
    db: Session = Depends(get_db)
):
    """
    Validates CSV file for schema compliance, detects missing values and duplicates,
    and optionally imports valid records into the database.
    """
    entity_type = entity_type.lower().strip()
    if entity_type not in REQUIRED_COLUMNS:
        raise HTTPException(status_code=400, detail=f"Invalid entity_type. Must be one of: {list(REQUIRED_COLUMNS.keys())}")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    total_rows = len(df)
    required_cols = REQUIRED_COLUMNS[entity_type]
    missing_headers = [col for col in required_cols if col not in df.columns]

    schema_errors = []
    if missing_headers:
        schema_errors.append(f"Missing required columns in CSV: {', '.join(missing_headers)}. Expected at least: {', '.join(required_cols)}")

    # Detect missing values
    missing_value_errors = []
    for col in required_cols:
        if col in df.columns:
            null_indices = df[df[col].isnull()].index.tolist()
            if null_indices:
                missing_value_errors.append({
                    "column": col,
                    "affected_rows": [i + 2 for i in null_indices[:15]], # +2 for 1-based + header
                    "count": len(null_indices),
                    "message": f"Column '{col}' has {len(null_indices)} missing value(s)."
                })

    # Detect duplicate rows
    duplicate_count = int(df.duplicated().sum())

    # Row-by-row validation
    valid_rows = []
    invalid_rows = []

    if not schema_errors:
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            row_errors = []

            # Check required fields are present and not null
            for col in required_cols:
                val = row_dict.get(col)
                if pd.isna(val) or val == "" or str(val).strip() == "":
                    row_errors.append(f"Missing value for required field '{col}'")

            # Entity-specific validation rules
            if entity_type == "products" and not row_errors:
                try:
                    p = float(row_dict["price"])
                    if p < 0:
                        row_errors.append("Price must be non-negative")
                except ValueError:
                    row_errors.append("Price must be a valid number")

            elif entity_type == "feedback" and not row_errors:
                try:
                    r = int(row_dict["rating"])
                    if r < 1 or r > 5:
                        row_errors.append("Rating must be between 1 and 5")
                except ValueError:
                    row_errors.append("Rating must be an integer between 1 and 5")

            elif entity_type == "orders" and not row_errors:
                try:
                    amt = float(row_dict["total_amount"])
                    if amt < 0:
                        row_errors.append("Total amount must be non-negative")
                except ValueError:
                    row_errors.append("Total amount must be a number")

            if row_errors:
                invalid_rows.append({"row_number": idx + 2, "errors": row_errors, "data": row_dict})
            else:
                valid_rows.append(row_dict)

    is_valid = (len(schema_errors) == 0 and len(invalid_rows) == 0 and total_rows > 0)

    # If commit is requested and there are valid rows
    imported_count = 0
    if commit and valid_rows and not schema_errors:
        for r in valid_rows:
            try:
                if entity_type == "customers":
                    cust = Customer(
                        name=str(r["name"]).strip(),
                        email=str(r["email"]).strip(),
                        region=str(r["region"]).strip(),
                        created_at=datetime.utcnow()
                    )
                    db.add(cust)
                elif entity_type == "products":
                    prod = Product(
                        name=str(r["name"]).strip(),
                        category=str(r["category"]).strip(),
                        price=float(r["price"])
                    )
                    db.add(prod)
                elif entity_type == "orders":
                    order = Order(
                        customer_id=int(r["customer_id"]),
                        total_amount=float(r["total_amount"]),
                        status=str(r.get("status", "Completed")).strip(),
                        region=str(r.get("region", "Central")).strip(),
                        order_date=datetime.utcnow()
                    )
                    db.add(order)
                elif entity_type == "feedback":
                    fb = Feedback(
                        customer_id=int(r["customer_id"]),
                        rating=int(r["rating"]),
                        comment=str(r.get("comment", "")).strip() if pd.notna(r.get("comment")) else "",
                        category=str(r["category"]).strip(),
                        created_at=datetime.utcnow()
                    )
                    db.add(fb)
                imported_count += 1
            except Exception:
                pass
        db.commit()

    # Preview first 10 rows
    preview = df.head(10).fillna("").to_dict(orient="records")

    return {
        "status": "success",
        "valid": is_valid,
        "committed": commit,
        "entity_type": entity_type,
        "total_rows": total_rows,
        "valid_rows_count": len(valid_rows),
        "invalid_rows_count": len(invalid_rows),
        "imported_rows_count": imported_count,
        "duplicate_rows": duplicate_count,
        "schema_errors": schema_errors,
        "missing_value_errors": missing_value_errors,
        "invalid_samples": invalid_rows[:5],
        "preview_data": preview,
        "message": (
            f"Successfully imported {imported_count} {entity_type} records."
            if commit and imported_count > 0
            else f"Validation complete: {len(valid_rows)} valid rows, {len(invalid_rows)} invalid rows."
        )
    }

@router.get("/export")
def export_data(
    entity: str = Query("orders", description="orders, customers, feedback, insights, products"),
    db: Session = Depends(get_db)
):
    """Exports dataset or analytics reports in CSV format."""
    entity = entity.lower().strip()
    stream = io.StringIO()

    if entity == "orders":
        orders = db.query(Order).all()
        data = [{
            "OrderID": o.id,
            "CustomerID": o.customer_id,
            "CustomerName": o.customer.name if o.customer else "",
            "OrderDate": o.order_date.strftime("%Y-%m-%d %H:%M:%S"),
            "TotalAmount": o.total_amount,
            "Status": o.status,
            "Region": o.region,
            "LineItemsCount": len(o.items)
        } for o in orders]
        df = pd.DataFrame(data)
        filename = f"businessinsights_orders_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    elif entity == "customers":
        cust_analytics = compute_customer_analytics(db)
        df = pd.DataFrame(cust_analytics["customers"])
        filename = f"businessinsights_customers_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    elif entity == "feedback":
        fbs = db.query(Feedback).all()
        data = [{
            "FeedbackID": f.id,
            "CustomerID": f.customer_id,
            "CustomerName": f.customer.name if f.customer else "",
            "Rating": f.rating,
            "Category": f.category,
            "Comment": f.comment,
            "Sentiment": "Positive" if f.rating >= 4 else ("Neutral" if f.rating == 3 else "Negative"),
            "CreatedAt": f.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for f in fbs]
        df = pd.DataFrame(data)
        filename = f"businessinsights_feedback_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    elif entity == "insights":
        insights = evaluate_business_insights(db)
        recs = generate_actionable_recommendations(db)
        rec_map = {r["insight_id"]: r for r in recs if "insight_id" in r}

        data = [{
            "InsightID": ins["id"],
            "Category": ins["category"],
            "Priority": ins["priority"],
            "Title": ins["title"],
            "Description": ins["description"],
            "BusinessImpact": ins["business_impact"],
            "RecommendedAction": ins["recommended_action"],
            "AssignedDepartment": rec_map.get(ins["id"], {}).get("department", "Management"),
            "ExpectedImpact": rec_map.get(ins["id"], {}).get("expected_impact", "Positive ROI")
        } for ins in insights]
        df = pd.DataFrame(data)
        filename = f"businessinsights_insights_recommendations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    elif entity == "products":
        prods = db.query(Product).all()
        data = [{
            "ProductID": p.id,
            "Name": p.name,
            "Category": p.category,
            "Price": p.price
        } for p in prods]
        df = pd.DataFrame(data)
        filename = f"businessinsights_products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    else:
        raise HTTPException(status_code=400, detail="Unknown entity for export.")

    df.to_csv(stream, index=False)
    csv_bytes = stream.getvalue().encode("utf-8")

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/load-sample")
def load_sample_data(db: Session = Depends(get_db)):
    """Resets the database and populates fresh realistic fictional sample business data."""
    try:
        result = generate_sample_data(db, force_reset=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate sample data: {str(e)}")

@router.get("/sample-template/{entity}")
def get_sample_template(entity: str):
    """Downloads sample template CSV file for testing uploads."""
    file_map = {
        "customers": "sample_customers.csv",
        "products": "sample_products.csv",
        "orders": "sample_orders.csv",
        "feedback": "sample_feedback.csv"
    }
    if entity not in file_map:
        raise HTTPException(status_code=404, detail="Sample template not found.")

    target_path = DATA_DIR / file_map[entity]
    if not target_path.exists():
        # Generate on the fly
        db = next(get_db())
        generate_sample_data(db, force_reset=False)

    return StreamingResponse(
        open(target_path, "rb"),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={file_map[entity]}"}
    )
