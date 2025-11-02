# backend/models.py
"""
Complete Data Models for NovoMarket
All Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


# ============ ENUMS ============

class UserRole(str, Enum):
    BUYER = "buyer"
    SELLER = "seller"
    ADMIN = "admin"


class ListingType(str, Enum):
    PRODUCT = "product"
    SERVICE = "service"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class NotificationType(str, Enum):
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_REMINDER = "booking_reminder"
    BOOKING_CANCELLED = "booking_cancelled"
    ORDER_PLACED = "order_placed"
    ORDER_SHIPPED = "order_shipped"
    ORDER_DELIVERED = "order_delivered"
    MESSAGE_RECEIVED = "message_received"
    REVIEW_RECEIVED = "review_received"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"


# ============ USER MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "buyer"
    avatar: Optional[str] = None
    verified: bool = False
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "buyer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    avatar: Optional[str] = None


# ============ LISTING MODELS ============

class Listing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    seller_name: str
    title: str
    description: str
    price: float
    category: str
    images: List[str] = []
    tags: List[str] = []
    stock: Optional[int] = 1
    verified: bool = False
    rating: float = 0.0
    reviews_count: int = 0
    type: str = "product"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ListingCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str
    images: List[str] = []
    tags: List[str] = []
    stock: Optional[int] = 1
    type: str = "product"


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    stock: Optional[int] = None
    type: Optional[str] = None


# ============ REVIEW MODELS ============

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewCreate(BaseModel):
    listing_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str


# ============ ORDER MODELS ============

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    buyer_name: str
    seller_id: str
    listing_id: str
    listing_title: str
    quantity: int
    total_amount: float
    status: str = "pending"
    payment_status: str = "pending"
    session_id: Optional[str] = None
    shipping_address: Optional[str] = None
    tracking_number: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    listing_id: str
    quantity: int = 1
    shipping_address: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None


# ============ BOOKING MODELS ============

class TimeSlot(BaseModel):
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    is_available: bool = True


class ServiceAvailability(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_id: str
    provider_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    time_slots: List[TimeSlot] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AvailabilityCreate(BaseModel):
    service_id: str
    day_of_week: int
    time_slots: List[TimeSlot]


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_id: str
    service_title: str
    provider_id: str
    provider_name: str
    client_id: str
    client_name: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    price: float
    status: str = "confirmed"
    notes: Optional[str] = None
    meeting_link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BookingCreate(BaseModel):
    service_id: str
    start_time: datetime
    duration_minutes: int = 30
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


# ============ MESSAGE MODELS ============

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    listing_id: Optional[str] = None
    message: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MessageCreate(BaseModel):
    receiver_id: str
    listing_id: Optional[str] = None
    message: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None


class Thread(BaseModel):
    id: str
    other_user_id: str
    other_user_name: str
    other_user_avatar: Optional[str] = None
    last_message: str
    last_message_time: datetime
    unread_count: int


# ============ NOTIFICATION MODELS ============

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    title: str
    message: str
    read: bool = False
    link: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


# ============ WISHLIST MODELS ============

class Wishlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    listing_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ PAYMENT MODELS ============

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


class CheckoutSessionResponse(BaseModel):
    """Response model for Stripe checkout session creation"""
    session_id: str
    url: str


class CheckoutStatusResponse(BaseModel):
    """Response model for checkout status check"""
    payment_status: str


# ============ ANALYTICS MODELS ============

class AnalyticsData(BaseModel):
    total_revenue: float = 0.0
    total_bookings: int = 0
    total_orders: int = 0
    avg_rating: float = 0.0
    popular_services: List[Dict[str, Any]] = []
    revenue_trend: List[Dict[str, Any]] = []


# ============ RECOMMENDATION MODELS ============

class RecommendationResponse(BaseModel):
    listings: List[Listing]
    reason: str


# ============ SEARCH MODELS ============

class SearchQuery(BaseModel):
    query: str
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    type: Optional[str] = None
    limit: int = 50


class SearchResponse(BaseModel):
    results: List[Listing]
    total: int
    page: int
    limit: int


# ============ FILE UPLOAD MODELS ============

class FileUploadResponse(BaseModel):
    file_url: str
    file_name: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None


# ============ PRICING MODELS ============

class PricingCalculation(BaseModel):
    base_price: float
    final_price: float
    adjustments: List[Dict[str, Any]] = []
    discount_percentage: float = 0.0
    savings: float = 0.0


# ============ STATISTICS MODELS ============

class DashboardStats(BaseModel):
    total_listings: int = 0
    total_bookings: int = 0
    total_revenue: float = 0.0
    pending_orders: int = 0
    recent_reviews: int = 0
    unread_messages: int = 0



    # ============ FREELANCER & SERVICE REQUEST MODELS ============

class ServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    title: str
    description: str
    category: str
    budget: float
    deadline: datetime
    skills_required: List[str] = []
    experience_level: str = "intermediate"  # beginner, intermediate, expert
    status: str = "open"  # open, in_progress, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Proposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_request_id: str
    freelancer_id: str
    cover_letter: str
    proposed_price: float
    delivery_time_days: int
    status: str = "pending"  # pending, accepted, rejected
    ai_match_score: int = 0  # 0-100
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FreelancerProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    experience_years: int = 0
    hourly_rate: Optional[float] = None
    portfolio_url: Optional[str] = None
    certifications: List[str] = []
    completed_projects: int = 0
    success_rate: float = 0.0
