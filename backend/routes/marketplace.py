# backend/routes/marketplace.py - FIXED VERSION
"""
NovoMarket Marketplace Routes - All Issues Fixed
Location: backend/routes/marketplace.py
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from typing import List, Optional
import uuid
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path

from database import get_db
from utils.auth_utils import get_current_user, hash_password, verify_password, create_access_token
from config import settings
from models import (
    User, UserCreate, UserLogin,
    Listing, ListingCreate, ListingUpdate,
    Review, ReviewCreate,
    Order,
    Message,
    Wishlist,
    PaymentTransaction, CheckoutSessionResponse, CheckoutStatusResponse
)

import stripe
stripe.api_key = settings.STRIPE_API_KEY

router = APIRouter()

# ============ AUTH ROUTES ============

@router.post("/auth/register")
async def register(user_data: UserCreate):
    """Register a new user"""
    db = get_db()
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

@router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    db = get_db()
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get('password', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.pop('password', None)
    if isinstance(user.get('timestamp'), str):
        user['created_at'] = datetime.fromisoformat(user.pop('timestamp'))
    
    token = create_access_token({"user_id": user['id'], "email": user['email']})
    return {"token": token, "user": User(**user).model_dump()}

@router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

# ============ LISTING ROUTES ============

@router.post("/listings", response_model=Listing)
async def create_listing(listing_data: ListingCreate, current_user: User = Depends(get_current_user)):
    """Create a new listing"""
    db = get_db()
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create listings")
    
    listing = Listing(
        seller_id=current_user.id,
        seller_name=current_user.name,
        **listing_data.model_dump()
    )
    
    listing_dict = listing.model_dump()
    listing_dict['timestamp'] = listing_dict.pop('created_at').isoformat()
    
    await db.listings.insert_one(listing_dict)
    return listing

@router.get("/listings", response_model=List[Listing])
async def get_listings(category: Optional[str] = None, search: Optional[str] = None, limit: int = 50):
    """Get all listings with optional filters"""
    db = get_db()
    query = {}
    if category:
        query['category'] = category
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    listings = await db.listings.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    for p in listings:
        if isinstance(p.get('timestamp'), str):
            p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
    
    return [Listing(**p) for p in listings]

@router.get("/listings/{listing_id}", response_model=Listing)
async def get_listing(listing_id: str):
    """Get a single listing by ID"""
    db = get_db()
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if isinstance(listing.get('timestamp'), str):
        listing['created_at'] = datetime.fromisoformat(listing.pop('timestamp'))
    
    return Listing(**listing)

@router.put("/listings/{listing_id}", response_model=Listing)
async def update_listing(listing_id: str, listing_data: ListingUpdate, current_user: User = Depends(get_current_user)):
    """Update a listing"""
    db = get_db()
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in listing_data.model_dump().items() if v is not None}
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if isinstance(updated.get('timestamp'), str):
        updated['created_at'] = datetime.fromisoformat(updated.pop('timestamp'))
    
    return Listing(**updated)

@router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, current_user: User = Depends(get_current_user)):
    """Delete a listing"""
    db = get_db()
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing['seller_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.delete_one({"id": listing_id})
    return {"message": "Listing deleted"}

# ============ REVIEW ROUTES ============

@router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
    """Create a review for a listing"""
    db = get_db()
    listing = await db.listings.find_one({"id": review_data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    review = Review(
        user_id=current_user.id,
        user_name=current_user.name,
        **review_data.model_dump()
    )
    
    review_dict = review.model_dump()
    review_dict['timestamp'] = review_dict.pop('created_at').isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Update listing rating
    reviews = await db.reviews.find({"listing_id": review_data.listing_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
    await db.listings.update_one(
        {"id": review_data.listing_id},
        {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
    )
    
    return review

@router.get("/reviews/{listing_id}", response_model=List[Review])
async def get_reviews(listing_id: str):
    """Get all reviews for a listing"""
    db = get_db()
    reviews = await db.reviews.find({"listing_id": listing_id}, {"_id": 0}).to_list(1000)
    
    for r in reviews:
        if isinstance(r.get('timestamp'), str):
            r['created_at'] = datetime.fromisoformat(r.pop('timestamp'))
    
    return [Review(**r) for r in reviews]

# ============ ORDER ROUTES - FIXED ============

@router.post("/orders", response_model=Order)
async def create_order(listing_id: str, quantity: int, current_user: User = Depends(get_current_user)):
    """Create a new order"""
    db = get_db()
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.get('type') == "product" and listing.get('stock', 0) < quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    order = Order(
        buyer_id=current_user.id,
        buyer_name=current_user.name,
        seller_id=listing['seller_id'],
        listing_id=listing_id,  # ✅ FIX: Include listing_id
        listing_title=listing['title'],  # ✅ FIX: Include listing_title
        quantity=quantity,
        total_amount=listing['price'] * quantity
    )
    
    order_dict = order.model_dump()
    order_dict['timestamp'] = order_dict.pop('created_at').isoformat()
    
    await db.orders.insert_one(order_dict)
    return order

@router.get("/orders")
async def get_orders(current_user: User = Depends(get_current_user)):
    """Get user's orders - FIXED to handle missing fields"""
    db = get_db()
    query = {"buyer_id": current_user.id} if current_user.role == "buyer" else {"seller_id": current_user.id}
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
    # ✅ FIX: Handle missing fields gracefully
    result = []
    for o in orders:
        # Convert timestamp
        if isinstance(o.get('timestamp'), str):
            o['created_at'] = datetime.fromisoformat(o.pop('timestamp'))
        
        # ✅ FIX: Provide defaults for missing fields
        if 'listing_id' not in o:
            o['listing_id'] = 'unknown'
        if 'listing_title' not in o:
            o['listing_title'] = 'Product'
        
        try:
            result.append(Order(**o))
        except Exception as e:
            print(f"⚠️ Skipping invalid order: {e}")
            continue
    
    return result

# ============ USER & MESSAGE ROUTES ============

@router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    """Get all users (for chat)"""
    db = get_db()
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    result = []
    for u in users:
        if u["id"] != current_user.id:
            if isinstance(u.get('timestamp'), str):
                u['created_at'] = datetime.fromisoformat(u.pop('timestamp'))
            result.append(User(**u))
    
    return result

@router.get("/messages/{other_user_id}", response_model=List[Message])
async def get_messages(other_user_id: str, current_user: User = Depends(get_current_user)):
    """Get messages with another user"""
    db = get_db()
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

# ============ FILE UPLOAD ============

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload a file"""
    try:
        # Check file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = settings.UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_url = f"http://localhost:8000/uploads/{unique_filename}"
        return {"file_url": file_url, "file_name": file.filename}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# ============ WISHLIST ROUTES ============

@router.post("/wishlist/{listing_id}")
async def add_to_wishlist(listing_id: str, current_user: User = Depends(get_current_user)):
    """Add listing to wishlist"""
    db = get_db()
    existing = await db.wishlist.find_one({"user_id": current_user.id, "listing_id": listing_id}, {"_id": 0})
    if existing:
        return {"message": "Already in wishlist"}
    
    wishlist = Wishlist(user_id=current_user.id, listing_id=listing_id)
    wishlist_dict = wishlist.model_dump()
    wishlist_dict['timestamp'] = wishlist_dict.pop('created_at').isoformat()
    
    await db.wishlist.insert_one(wishlist_dict)
    return {"message": "Added to wishlist"}

@router.delete("/wishlist/{listing_id}")
async def remove_from_wishlist(listing_id: str, current_user: User = Depends(get_current_user)):
    """Remove listing from wishlist"""
    db = get_db()
    await db.wishlist.delete_one({"user_id": current_user.id, "listing_id": listing_id})
    return {"message": "Removed from wishlist"}

@router.get("/wishlist", response_model=List[Listing])
async def get_wishlist(current_user: User = Depends(get_current_user)):
    """Get user's wishlist"""
    db = get_db()
    wishlist_items = await db.wishlist.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    listing_ids = [item['listing_id'] for item in wishlist_items]
    
    listings = await db.listings.find({"id": {"$in": listing_ids}}, {"_id": 0}).to_list(1000)
    
    for p in listings:
        if isinstance(p.get('timestamp'), str):
            p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
    
    return [Listing(**p) for p in listings]

# ============ PAYMENT ROUTES (STRIPE) ============

@router.post("/checkout/session", response_model=CheckoutSessionResponse)
async def create_checkout_session(order_id: str, request: Request, current_user: User = Depends(get_current_user)):
    """Create Stripe checkout session"""
    db = get_db()
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['buyer_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    host_url = str(request.base_url)
    success_url = f"{host_url}payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}payment-cancel"

    try:
        # ✅ FIX: Handle missing listing_title
        listing_title = order.get('listing_title', 'Product')
        
        checkout_session = stripe.checkout.Session.create(
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': listing_title},
                    'unit_amount': int(order['total_amount'] * 100),
                },
                'quantity': order['quantity'],
            }],
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

@router.get("/checkout/status/{session_id}", response_model=CheckoutStatusResponse)
async def get_checkout_status(session_id: str, current_user: User = Depends(get_current_user)):
    """Get checkout session status"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        payment_status = session.payment_status

        if payment_status == "paid":
            db = get_db()
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
                if order and 'listing_id' in order:
                    await db.listings.update_one(
                        {"id": order['listing_id']},
                        {"$inc": {"stock": -order['quantity']}}
                    )
        
        return CheckoutStatusResponse(payment_status=payment_status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Stripe webhook handler"""
    db = get_db()
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=sig_header, secret=settings.STRIPE_WEBHOOK_SECRET
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid signature")

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