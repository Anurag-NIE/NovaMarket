from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import stripe
from chat_manager import connection_manager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
stripe.api_key = STRIPE_API_KEY

# Create uploads directory if it doesn't exist
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ Models ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "buyer"  # buyer or seller
    avatar: Optional[str] = None
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "buyer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    seller_name: str
    title: str
    description: str
    price: float
    category: str
    images: List[str]
    tags: List[str] = []
    stock: int = 1
    verified: bool = False
    rating: float = 0.0
    reviews_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str
    images: List[str]
    tags: List[str] = []
    stock: int = 1

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    stock: Optional[int] = None

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    buyer_name: str
    seller_id: str
    product_id: str
    product_title: str
    quantity: int
    total_amount: float
    status: str = "pending"  # pending, confirmed, shipped, delivered, cancelled
    payment_status: str = "pending"
    session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    product_id: Optional[str] = None
    message: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    receiver_id: str
    product_id: Optional[str] = None
    message: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None


# ============ Add Service Models (After Message model) ============

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    seller_name: str
    seller_email: str
    seller_avatar: Optional[str] = None
    title: str
    description: str
    category: str
    price: float
    image: Optional[str] = None
    tags: List[str] = []
    rating: float = 0.0
    reviews_count: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    title: str
    description: str
    category: str
    price: float
    image: Optional[str] = None
    tags: List[str] = []

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    tags: Optional[List[str]] = None
    active: Optional[bool] = None


class Thread(BaseModel):
    id: str
    other_user_id: str
    other_user_name: str
    other_user_avatar: Optional[str] = None
    last_message: str
    last_message_time: datetime
    unread_count: int

class Wishlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    order_id: str
    buyer_id: str
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ Auth Helpers ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ Routes ============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    user_dict = user.model_dump()
    user_dict['timestamp'] = user_dict.pop('created_at').isoformat()
    user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"user_id": user.id, "email": user.email})
    return {"token": token, "user": user.model_dump()}

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get('password', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.pop('password', None)
    if isinstance(user.get('timestamp'), str):
        user['created_at'] = datetime.fromisoformat(user.pop('timestamp'))
    
    token = create_access_token({"user_id": user['id'], "email": user['email']})
    return {"token": token, "user": User(**user).model_dump()}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Products
@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create products")
    
    product = Product(
        seller_id=current_user.id,
        seller_name=current_user.name,
        **product_data.model_dump()
    )
    
    product_dict = product.model_dump()
    product_dict['timestamp'] = product_dict.pop('created_at').isoformat()
    
    await db.products.insert_one(product_dict)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, search: Optional[str] = None, limit: int = 50):
    query = {}
    if category:
        query['category'] = category
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    for p in products:
        if isinstance(p.get('timestamp'), str):
            p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
    
    return [Product(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('timestamp'), str):
        product['created_at'] = datetime.fromisoformat(product.pop('timestamp'))
    
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('timestamp'), str):
        updated['created_at'] = datetime.fromisoformat(updated.pop('timestamp'))
    
    return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted"}



# ============ Add these routes after Products routes ============

# ============ Services Routes ============

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    """Create a new service (sellers only)"""
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create services")
    
    service = Service(
        seller_id=current_user.id,
        seller_name=current_user.name,
        seller_email=current_user.email,
        seller_avatar=current_user.avatar,
        **service_data.model_dump()
    )
    
    service_dict = service.model_dump()
    service_dict['timestamp'] = service_dict.pop('created_at').isoformat()
    
    await db.services.insert_one(service_dict)
    return service

@api_router.get("/services", response_model=List[Service])
async def get_services(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    seller_id: Optional[str] = None,
    limit: int = 50
):
    """Get all services with optional filters"""
    query = {"active": True}
    
    if category:
        query['category'] = category
    
    if seller_id:
        query['seller_id'] = seller_id
    
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'tags': {'$regex': search, '$options': 'i'}}
        ]
    
    if min_price is not None or max_price is not None:
        query['price'] = {}
        if min_price is not None:
            query['price']['$gte'] = min_price
        if max_price is not None:
            query['price']['$lte'] = max_price
    
    services = await db.services.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    for s in services:
        if isinstance(s.get('timestamp'), str):
            s['created_at'] = datetime.fromisoformat(s.pop('timestamp'))
    
    return [Service(**s) for s in services]

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    """Get a single service by ID"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if isinstance(service.get('timestamp'), str):
        service['created_at'] = datetime.fromisoformat(service.pop('timestamp'))
    
    return Service(**service)

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(
    service_id: str,
    service_data: ServiceUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a service (only by the seller who created it)"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if service['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this service")
    
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}
    await db.services.update_one({"id": service_id}, {"$set": update_data})
    
    updated = await db.services.find_one({"id": service_id}, {"_id": 0})
    if isinstance(updated.get('timestamp'), str):
        updated['created_at'] = datetime.fromisoformat(updated.pop('timestamp'))
    
    return Service(**updated)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_user)):
    """Delete a service (soft delete by setting active=False)"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if service['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this service")
    
    await db.services.update_one(
        {"id": service_id},
        {"$set": {"active": False}}
    )
    return {"message": "Service deleted successfully"}

@api_router.get("/categories/services", response_model=List[str])
async def get_service_categories():
    """Get all unique service categories"""
    categories = await db.services.distinct("category", {"active": True})
    return sorted(categories)

@api_router.post("/services/{service_id}/book")
async def book_service(service_id: str, current_user: User = Depends(get_current_user)):
    """Book a service (creates an order)"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if not service.get('active'):
        raise HTTPException(status_code=400, detail="Service is not available")
    
    if service['seller_id'] == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book your own service")
    
    order = Order(
        buyer_id=current_user.id,
        buyer_name=current_user.name,
        seller_id=service['seller_id'],
        product_id=service_id,
        product_title=service['title'],
        quantity=1,
        total_amount=service['price']
    )
    
    order_dict = order.model_dump()
    order_dict['timestamp'] = order_dict.pop('created_at').isoformat()
    
    await db.orders.insert_one(order_dict)
    return {"message": "Service booked successfully", "order_id": order.id}




# Reviews
@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": review_data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    review = Review(
        user_id=current_user.id,
        user_name=current_user.name,
        **review_data.model_dump()
    )
    
    review_dict = review.model_dump()
    review_dict['timestamp'] = review_dict.pop('created_at').isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Update product rating
    reviews = await db.reviews.find({"product_id": review_data.product_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
    await db.products.update_one(
        {"id": review_data.product_id},
        {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
    )
    
    return review

@api_router.get("/reviews/{product_id}", response_model=List[Review])
async def get_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    
    for r in reviews:
        if isinstance(r.get('timestamp'), str):
            r['created_at'] = datetime.fromisoformat(r.pop('timestamp'))
    
    return [Review(**r) for r in reviews]

# Orders
@api_router.post("/orders", response_model=Order)
async def create_order(product_id: str, quantity: int, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product['stock'] < quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    order = Order(
        buyer_id=current_user.id,
        buyer_name=current_user.name,
        seller_id=product['seller_id'],
        product_id=product_id,
        product_title=product['title'],
        quantity=quantity,
        total_amount=product['price'] * quantity
    )
    
    order_dict = order.model_dump()
    order_dict['timestamp'] = order_dict.pop('created_at').isoformat()
    
    await db.orders.insert_one(order_dict)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    query = {"buyer_id": current_user.id} if current_user.role == "buyer" else {"seller_id": current_user.id}
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
    for o in orders:
        if isinstance(o.get('timestamp'), str):
            o['created_at'] = datetime.fromisoformat(o.pop('timestamp'))
    
    return [Order(**o) for o in orders]

# Messages
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, current_user: User = Depends(get_current_user)):
    message = Message(
        sender_id=current_user.id,
        **message_data.model_dump()
    )
    
    message_dict = message.model_dump()
    message_dict['timestamp'] = message_dict.pop('created_at').isoformat()
    
    await db.messages.insert_one(message_dict)
    return message

@api_router.get("/messages/threads", response_model=List[Thread])
async def get_threads(current_user: User = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [{"sender_id": current_user.id}, {"receiver_id": current_user.id}]},
        {"_id": 0}
    ).to_list(10000)
    
    threads_map = {}
    for msg in messages:
        other_id = msg['receiver_id'] if msg['sender_id'] == current_user.id else msg['sender_id']
        
        if other_id not in threads_map:
            threads_map[other_id] = {
                "messages": [],
                "unread": 0
            }
        
        threads_map[other_id]["messages"].append(msg)
        if msg['receiver_id'] == current_user.id and not msg['read']:
            threads_map[other_id]["unread"] += 1
    
    threads = []
    for other_id, data in threads_map.items():
        other_user = await db.users.find_one({"id": other_id}, {"_id": 0, "password": 0})
        if other_user:
            last_msg = sorted(data["messages"], key=lambda x: x['timestamp'] if isinstance(x['timestamp'], str) else x['created_at'].isoformat(), reverse=True)[0]
            threads.append(Thread(
                id=other_id,
                other_user_id=other_id,
                other_user_name=other_user['name'],
                other_user_avatar=other_user.get('avatar'),
                last_message=last_msg['message'],
                last_message_time=datetime.fromisoformat(last_msg['timestamp']) if isinstance(last_msg.get('timestamp'), str) else last_msg['created_at'],
                unread_count=data["unread"]
            ))
    
    return sorted(threads, key=lambda x: x.last_message_time, reverse=True)

@api_router.get("/messages/{other_user_id}", response_model=List[Message])
async def get_messages(other_user_id: str, current_user: User = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": current_user.id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": current_user.id}
        ]},
        {"_id": 0}
    ).to_list(10000)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": current_user.id},
        {"$set": {"read": True}}
    )
    
    for m in messages:
        if isinstance(m.get('timestamp'), str):
            m['created_at'] = datetime.fromisoformat(m.pop('timestamp'))
    
    return sorted([Message(**m) for m in messages], key=lambda x: x.created_at)

# Wishlist
@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, current_user: User = Depends(get_current_user)):
    existing = await db.wishlist.find_one({"user_id": current_user.id, "product_id": product_id}, {"_id": 0})
    if existing:
        return {"message": "Already in wishlist"}
    
    wishlist = Wishlist(user_id=current_user.id, product_id=product_id)
    wishlist_dict = wishlist.model_dump()
    wishlist_dict['timestamp'] = wishlist_dict.pop('created_at').isoformat()
    
    await db.wishlist.insert_one(wishlist_dict)
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: User = Depends(get_current_user)):
    await db.wishlist.delete_one({"user_id": current_user.id, "product_id": product_id})
    return {"message": "Removed from wishlist"}

@api_router.get("/wishlist", response_model=List[Product])
async def get_wishlist(current_user: User = Depends(get_current_user)):
    wishlist_items = await db.wishlist.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    product_ids = [item['product_id'] for item in wishlist_items]
    
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(1000)
    
    for p in products:
        if isinstance(p.get('timestamp'), str):
            p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
    
    return [Product(**p) for p in products]

# Payments

class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str

@api_router.post("/checkout/session", response_model=CheckoutSessionResponse)
async def create_checkout_session(order_id: str, request: Request, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['buyer_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    host_url = str(request.base_url)
    success_url = f"{host_url}payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}payment-cancel"

    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': order['product_title'],
                        },
                        'unit_amount': int(order['total_amount'] * 100),
                    },
                    'quantity': order['quantity'],
                },
            ],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"order_id": order_id, "buyer_id": current_user.id}
        )

        transaction = PaymentTransaction(
            session_id=checkout_session.id,
            order_id=order_id,
            buyer_id=current_user.id,
            amount=float(order['total_amount']),
            currency="usd",
            payment_status="pending",
            metadata={"order_id": order_id}
        )
        
        transaction_dict = transaction.model_dump()
        transaction_dict['timestamp'] = transaction_dict.pop('created_at').isoformat()
        
        await db.payment_transactions.insert_one(transaction_dict)
        await db.orders.update_one({"id": order_id}, {"$set": {"session_id": checkout_session.id}})
        
        return CheckoutSessionResponse(session_id=checkout_session.id, url=checkout_session.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CheckoutStatusResponse(BaseModel):
    payment_status: str

@api_router.get("/checkout/status/{session_id}", response_model=CheckoutStatusResponse)
async def get_checkout_status(session_id: str, current_user: User = Depends(get_current_user)):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        payment_status = session.payment_status

        if payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction and transaction['payment_status'] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                await db.orders.update_one(
                    {"id": transaction['order_id']},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
                
                order = await db.orders.find_one({"id": transaction['order_id']}, {"_id": 0})
                if order:
                    await db.products.update_one(
                        {"id": order['product_id']},
                        {"$inc": {"stock": -order['quantity']}}
                    )
        
        return CheckoutStatusResponse(payment_status=payment_status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=sig_header, secret=STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session['id']
        payment_status = session['payment_status']

        if payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction and transaction['payment_status'] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                await db.orders.update_one(
                    {"id": transaction['order_id']},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )

    return {"status": "success"}

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    """Return all users except the current logged-in one."""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    filtered_users = [User(**u) for u in users if u["id"] != current_user.id]
    return filtered_users

# ============ File Upload ============

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload a file and return its URL"""
    try:
        # Validate file size (10MB max)
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return URL (use full URL for better compatibility)
        file_url = f"http://localhost:8000/uploads/{unique_filename}"
        return {"file_url": file_url, "file_name": file.filename}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")




# ============ Include Router ============
app.include_router(api_router)


# ============ Mount Static Files BEFORE Router ============
# This must be done before including the API router to avoid route conflicts
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# # ============ Include Router ============
# app.include_router(api_router)

# ============ Middleware ============
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ WebSocket for Chat ============

# @app.websocket("/ws/chat/{user_id}")
# async def chat_endpoint(websocket: WebSocket, user_id: str):
#     """Main WebSocket endpoint for real-time 1-to-1 chat with file sharing."""
#     await connection_manager.connect(websocket, user_id)
#     try:
#         while True:
#             data = await websocket.receive_json()
#             receiver_id = data.get("receiver_id")
#             message_text = data.get("message", "")
#             file_url = data.get("file_url")
#             file_type = data.get("file_type")
#             file_name = data.get("file_name")

#             # ✅ Save message to MongoDB
#             message_doc = {
#                 "id": str(uuid.uuid4()),
#                 "sender_id": user_id,
#                 "receiver_id": receiver_id,
#                 "message": message_text,
#                 "file_url": file_url,
#                 "file_type": file_type,
#                 "file_name": file_name,
#                 "read": False,
#                 "timestamp": datetime.now(timezone.utc).isoformat(),
#             }
#             await db.messages.insert_one(message_doc)

#             # ✅ Send to receiver (if online)
#             await connection_manager.send_personal_message(receiver_id, {
#                 "type": "chat",
#                 "data": message_doc
#             })

#             # ✅ Echo back to sender (for their chat window)
#             await websocket.send_json({
#                 "type": "chat",
#                 "data": message_doc
#             })

#     except WebSocketDisconnect:
#         await connection_manager.disconnect(websocket, user_id)
#         # 🔹 Notify all users of updated online list
#         await connection_manager.broadcast_online_users()



# ============ WebSocket for Chat ============

@app.websocket("/ws/chat/{user_id}")
async def chat_endpoint(websocket: WebSocket, user_id: str):
    """Main WebSocket endpoint for real-time 1-to-1 chat with file sharing."""
    await connection_manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            message_text = data.get("message", "")
            file_url = data.get("file_url")
            file_type = data.get("file_type")
            file_name = data.get("file_name")

            # ✅ Create message document
            message_doc = {
                "id": str(uuid.uuid4()),
                "sender_id": user_id,
                "receiver_id": receiver_id,
                "message": message_text,
                "file_url": file_url,
                "file_type": file_type,
                "file_name": file_name,
                "read": False,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            
            # ✅ Save to MongoDB
            await db.messages.insert_one(message_doc.copy())

            # ✅ Prepare WebSocket message (remove MongoDB _id if added)
            ws_message = {
                "type": "chat",
                "data": message_doc
            }
            
            print(f"📤 Sending message from {user_id} to {receiver_id}")

            # ✅ Send to receiver (if online)
            await connection_manager.send_personal_message(receiver_id, ws_message)

            # ✅ Echo back to sender (for their own chat window)
            await websocket.send_json(ws_message)
            
            print(f"✅ Message delivered successfully")

    except WebSocketDisconnect:
        print(f"🔌 User {user_id} disconnected")
        await connection_manager.disconnect(websocket, user_id)
        # Notify all users of updated online list
        await connection_manager.broadcast_online_users()
    except Exception as e:
        print(f"❌ WebSocket error for user {user_id}: {e}")
        await connection_manager.disconnect(websocket, user_id)
        await connection_manager.broadcast_online_users()





# ============ Shutdown Event ============

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()