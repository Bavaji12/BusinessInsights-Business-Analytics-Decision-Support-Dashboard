import random
from datetime import datetime, timedelta
import pandas as pd
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import Customer, Product, Order, OrderItem, Feedback
from app.database import Base, engine, SessionLocal
from app.config import DATA_DIR

# Set deterministic seed for reproducibility
random.seed(42)

REGIONS = ["North", "South", "East", "West", "Central"]

SAMPLE_PRODUCTS = [
    # Electronics
    {"name": "UltraHD Smart Monitor 27-inch", "category": "Electronics", "price": 349.99},
    {"name": "Wireless Noise-Cancelling Headphones", "category": "Electronics", "price": 199.50},
    {"name": "Ergonomic Mechanical Keyboard", "category": "Electronics", "price": 129.99},
    {"name": "Precision Laser Mouse", "category": "Electronics", "price": 59.99},
    {"name": "Thunderbolt 4 Docking Station", "category": "Electronics", "price": 219.00},
    {"name": "Smart Conference Speakerphone", "category": "Electronics", "price": 159.00},
    # Office Supplies
    {"name": "Executive Leather Notebook Set", "category": "Office Supplies", "price": 28.50},
    {"name": "Gel Ink Retractable Pens (Pack of 20)", "category": "Office Supplies", "price": 18.99},
    {"name": "Heavy-Duty Desktop Stapler", "category": "Office Supplies", "price": 22.00},
    {"name": "Recycled Copy Paper (5 Reams)", "category": "Office Supplies", "price": 45.00},
    {"name": "Acoustic Desk Partition Screen", "category": "Office Supplies", "price": 89.00},
    # Furniture
    {"name": "Ergonomic Lumbar Mesh Office Chair", "category": "Furniture", "price": 289.99},
    {"name": "Motorized Electric Standing Desk (60x30)", "category": "Furniture", "price": 499.00},
    {"name": "Mobile 3-Drawer Filing Cabinet", "category": "Furniture", "price": 149.50},
    {"name": "Dual Monitor Desk Mount Arm", "category": "Furniture", "price": 79.99},
    {"name": "Anti-Fatigue Standing Desk Mat", "category": "Furniture", "price": 49.00},
    # Software & Subscriptions
    {"name": "Business Analytics Pro (Annual License)", "category": "Software", "price": 599.00},
    {"name": "Cloud Security Suite (Quarterly)", "category": "Software", "price": 249.00},
    {"name": "Enterprise Project Planner (1 User)", "category": "Software", "price": 180.00},
    {"name": "CRM Integration Connector (Lifetime)", "category": "Software", "price": 320.00},
    # Hardware & Accessories
    {"name": "Portable External SSD 1TB USB-C", "category": "Hardware", "price": 119.99},
    {"name": "Cat6 Ethernet Cable Reel (100m)", "category": "Hardware", "price": 65.00},
    {"name": "Enterprise Wi-Fi 6 Access Point", "category": "Hardware", "price": 189.99},
    {"name": "Smart Power Strip with Surge Protection", "category": "Hardware", "price": 39.50},
    {"name": "Cable Management Spine & Tray", "category": "Hardware", "price": 34.00},
]

FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Margaret", "Anthony", "Betty", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna",
    "Kenneth", "Michelle", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
    "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon",
    "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
    "Nicholas", "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda",
    "Larry", "Pamela", "Justin", "Emma", "Scott", "Nicole", "Brandon", "Helen",
    "Benjamin", "Samantha", "Samuel", "Katherine", "Frank", "Christine", "Gregory", "Debra",
    "Raymond", "Rachel", "Alexander", "Carolyn", "Patrick", "Janet", "Jack", "Catherine",
    "Dennis", "Maria", "Jerry", "Heather", "Tyler", "Diane", "Aaron", "Ruth"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker"
]

FEEDBACK_TEMPLATES = [
    # Positive (4-5 stars)
    {"rating": 5, "category": "Product Quality", "comment": "Outstanding build quality! The ergonomic chair relieved my back pain within 3 days."},
    {"rating": 5, "category": "Customer Support", "comment": "The support agent solved our enterprise licensing query within 10 minutes. Superb service."},
    {"rating": 5, "category": "Delivery", "comment": "Order arrived 2 days earlier than estimated. Packaging was secure and flawless."},
    {"rating": 4, "category": "Website Usability", "comment": "Very smooth checkout process and clear order tracking updates."},
    {"rating": 5, "category": "Pricing", "comment": "Great value for money compared to corporate competitors. Will definitely order again."},
    {"rating": 4, "category": "Product Quality", "comment": "Monitor display colors are crisp and accurate. Stand is very solid."},
    {"rating": 5, "category": "Product Quality", "comment": "Noise cancelling headphones block out the entire open-plan office chatter. Impressive."},
    {"rating": 4, "category": "Delivery", "comment": "Prompt dispatch and delivery driver called ahead as requested."},
    {"rating": 5, "category": "Customer Support", "comment": "Knowledgeable technical support assisted with docking station drivers immediately."},
    {"rating": 4, "category": "Pricing", "comment": "Good volume discount on office stationery reams for our quarterly restock."},

    # Neutral / Mixed (3 stars)
    {"rating": 3, "category": "Delivery", "comment": "Delivery was on time, but outer cardboard box was slightly crushed. Product inside was safe."},
    {"rating": 3, "category": "Pricing", "comment": "Prices are acceptable, but shipping fee for regional zones feels a bit steep."},
    {"rating": 3, "category": "Website Usability", "comment": "Search filters could be improved. Took a while to locate specific cable length."},
    {"rating": 3, "category": "Product Quality", "comment": "Desk assembly instructions were somewhat confusing, though the desk itself is sturdy."},
    {"rating": 3, "category": "Customer Support", "comment": "Support was polite, but had to transfer me between two departments before resolving."},

    # Negative / Complaints (1-2 stars)
    {"rating": 2, "category": "Delivery", "comment": "Delayed by 5 days without any tracking updates. Logistics partner needs urgent review."},
    {"rating": 1, "category": "Delivery", "comment": "Package marked as delivered but didn't show up until 48 hours later. Frustrating experience."},
    {"rating": 2, "category": "Customer Support", "comment": "Automated bot was unhelpful and waiting for a live agent took over 35 minutes."},
    {"rating": 1, "category": "Product Quality", "comment": "Mouse scroll wheel started squeaking after 2 weeks of normal usage."},
    {"rating": 2, "category": "Pricing", "comment": "Recent price increase of 15% on subscriptions without prior notification is disappointing."},
    {"rating": 1, "category": "Delivery", "comment": "Courier left the expensive electronics package outside in the rain without ringing bell."},
    {"rating": 2, "category": "Website Usability", "comment": "Payment gateway timed out twice before transaction succeeded."},
    {"rating": 1, "category": "Customer Support", "comment": "Refund request took over 12 business days to process despite initial policy stating 3-5 days."},
]

def generate_sample_data(db: Session, force_reset: bool = True):
    """
    Generates realistic fictional sample data and populates SQLite database.
    Also creates sample CSV files in backend/sample_data/
    """
    if force_reset:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    # 1. Create Products
    products_list = []
    for prod_info in SAMPLE_PRODUCTS:
        product = Product(
            name=prod_info["name"],
            category=prod_info["category"],
            price=prod_info["price"]
        )
        db.add(product)
        products_list.append(product)
    db.commit()

    # 2. Create 125 Customers
    customers_list = []
    # Base reference date: late 2026 / current date
    now = datetime(2026, 11, 15, 12, 0, 0)

    for i in range(125):
        fname = random.choice(FIRST_NAMES)
        lname = random.choice(LAST_NAMES)
        # Distribute created_at over the last 18 months
        days_ago = random.randint(10, 500)
        cust_created = now - timedelta(days=days_ago)
        region = random.choice(REGIONS)
        # Email format
        email = f"{fname.lower()}.{lname.lower()}{random.randint(10, 999)}@example.com"
        customer = Customer(
            name=f"{fname} {lname}",
            email=email,
            region=region,
            created_at=cust_created
        )
        db.add(customer)
        customers_list.append(customer)
    db.commit()

    # 3. Create 450 Orders with OrderItems
    # Status distribution: 82% Completed, 8% Processing, 6% Cancelled, 4% Refunded
    status_weights = ["Completed"] * 82 + ["Processing"] * 8 + ["Cancelled"] * 6 + ["Refunded"] * 4
    
    # We will simulate monthly trends:
    # 2026-Q1 strong, 2026-Q2 slight dip in West region, Q3 recovery, with a recent delivery complaint rise in South
    orders_list = []
    order_items_list = []

    for i in range(450):
        customer = random.choice(customers_list)
        # Order date between customer created_at and now
        max_days = (now - customer.created_at).days
        if max_days <= 0:
            order_date = customer.created_at + timedelta(hours=random.randint(1, 24))
        else:
            order_date = customer.created_at + timedelta(days=random.randint(0, max_days), hours=random.randint(1, 23))

        status = random.choice(status_weights)
        region = customer.region

        # 1 to 4 items per order
        num_items = random.choices([1, 2, 3, 4], weights=[45, 35, 15, 5])[0]
        selected_prods = random.sample(products_list, num_items)

        total_amount = 0.0
        current_items = []
        for prod in selected_prods:
            qty = random.choices([1, 2, 3, 5], weights=[65, 20, 10, 5])[0]
            unit_price = prod.price
            item_total = qty * unit_price
            total_amount += item_total
            current_items.append((prod.id, qty, unit_price))

        order = Order(
            customer_id=customer.id,
            order_date=order_date,
            total_amount=round(total_amount, 2),
            status=status,
            region=region
        )
        db.add(order)
        db.flush() # get order.id

        for prod_id, qty, unit_price in current_items:
            item = OrderItem(
                order_id=order.id,
                product_id=prod_id,
                quantity=qty,
                unit_price=unit_price
            )
            db.add(item)
            order_items_list.append(item)
        orders_list.append(order)

    db.commit()

    # 4. Create 135 Feedback Records
    feedbacks_list = []
    for i in range(135):
        customer = random.choice(customers_list)
        template = random.choice(FEEDBACK_TEMPLATES)
        # Random date within last 6 months
        days_ago = random.randint(1, 180)
        feedback_date = now - timedelta(days=days_ago, hours=random.randint(1, 12))

        fb = Feedback(
            customer_id=customer.id,
            rating=template["rating"],
            comment=template["comment"],
            category=template["category"],
            created_at=feedback_date
        )
        db.add(fb)
        feedbacks_list.append(fb)

    db.commit()

    # 5. Export sample CSV files to DATA_DIR for downloadable templates and user inspection
    export_sample_csvs(db)

    return {
        "status": "success",
        "customers_count": len(customers_list),
        "products_count": len(products_list),
        "orders_count": len(orders_list),
        "order_items_count": len(order_items_list),
        "feedback_count": len(feedbacks_list),
        "message": "Realistic fictional sample business dataset generated successfully."
    }


def export_sample_csvs(db: Session):
    """Generates clean CSV files in backend/sample_data for user downloads and template reference."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Customers CSV
    custs = db.query(Customer).all()
    cust_df = pd.DataFrame([{
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "region": c.region,
        "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for c in custs])
    cust_df.to_csv(DATA_DIR / "sample_customers.csv", index=False)

    # Products CSV
    prods = db.query(Product).all()
    prod_df = pd.DataFrame([{
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "price": p.price
    } for p in prods])
    prod_df.to_csv(DATA_DIR / "sample_products.csv", index=False)

    # Orders CSV
    orders = db.query(Order).all()
    orders_df = pd.DataFrame([{
        "id": o.id,
        "customer_id": o.customer_id,
        "order_date": o.order_date.strftime("%Y-%m-%d %H:%M:%S"),
        "total_amount": o.total_amount,
        "status": o.status,
        "region": o.region
    } for o in orders])
    orders_df.to_csv(DATA_DIR / "sample_orders.csv", index=False)

    # Feedback CSV
    feedbacks = db.query(Feedback).all()
    fb_df = pd.DataFrame([{
        "id": f.id,
        "customer_id": f.customer_id,
        "rating": f.rating,
        "comment": f.comment,
        "category": f.category,
        "created_at": f.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for f in feedbacks])
    fb_df.to_csv(DATA_DIR / "sample_feedback.csv", index=False)


if __name__ == "__main__":
    db = SessionLocal()
    res = generate_sample_data(db, force_reset=True)
    print(res)
    db.close()
