# backend/server.py - COMPLETE FIXED VERSION
"""
NovoMarket Backend API - Fully Integrated & Fixed
All features working, all imports resolved
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Body, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from contextlib import asynccontextmanager

# Configuration and database
from config import settings
from database import database, get_db, init_indexes
from utils.websocket_manager import connection_manager
from utils.auth_utils import get_current_user
from models import User, TimeSlot, ServiceAvailability, Booking, BookingCreate, AvailabilityCreate

# Import services
from services import notification_service
from services import booking_service

# Near the top with other imports
from routes import freelancer_routes


# ============ LOGGING SETUP ============
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ LIFESPAN MANAGER ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting NovoMarket Backend...")
    
    try:
        # Initialize database
        database.connect()
        logger.info("✅ Database connected")
        
        # Validate configuration
        settings.validate()
        logger.info("✅ Configuration validated")
        
        # Create indexes
        try:
            await init_indexes()
            logger.info("✅ Database indexes initialized")
        except Exception as idx_err:
            logger.warning(f"⚠️ Index init failed (non-critical): {idx_err}")
        
        # Log configuration
        logger.info(f"📊 MongoDB: {settings.DB_NAME}")
        logger.info(f"📡 API Documentation: http://localhost:8000/docs")
        logger.info(f"🌐 CORS Origins: {settings.CORS_ORIGINS}")
        logger.info(f"📧 Email Service: {'Enabled' if settings.SMTP_USER else 'Disabled'}")
        
        logger.info("🎉 NovoMarket Backend started successfully!")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    finally:
        # Cleanup
        database.close()
        from database import redis_client
        if redis_client:
            redis_client.close()
        logger.info("👋 Shutting down NovoMarket Backend...")

# ============ CREATE APP ============
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Client Service Marketplace API with Advanced Features",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ============ MIDDLEWARE ============
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ INCLUDE ROUTERS ============
from routes import marketplace, notification_routes, service_request_routes, booking_routes

# Include all routers
app.include_router(marketplace.router, prefix="/api", tags=["Marketplace"])
app.include_router(notification_routes.router, prefix="/api", tags=["Notifications"])
# app.include_router(service_request_routes.router, prefix="/api", tags=["Service Requests"])
app.include_router(booking_routes.router, prefix="/api", tags=["Bookings"])
app.include_router(freelancer_routes.router, prefix="/api", tags=["Freelancer"])


# Try to include freelancer routes
try:
    from routes import freelancer_routes
    app.include_router(freelancer_routes.router, prefix="/api", tags=["Freelancer"])
    logger.info("✅ Freelancer routes included")
except ImportError as e:
    logger.warning(f"⚠️ Freelancer routes not found: {e}")

# Include notification service router if available
if hasattr(notification_service, 'router'):
    app.include_router(notification_service.router, prefix="/api/notifications", tags=["Notifications Service"])
    logger.info("✅ Notification service router included")

# ============ STATIC FILES ============
try:
    app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
    logger.info("✅ Static files mounted at /uploads")
except Exception as e:
    logger.warning(f"⚠️ Failed to mount static files: {e}")

# ============ ROOT ENDPOINTS ============
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": f"{settings.APP_NAME} is running 🚀",
        "version": settings.APP_VERSION,
        "status": "healthy",
        "docs": "/docs",
        "features": [
            "✅ User Authentication",
            "✅ Product & Service Listings",
            "✅ Advanced Booking System",
            "✅ Service Request Board",
            "✅ Freelancer Profiles",
            "✅ Proposal System",
            "✅ Real-time Chat",
            "✅ Payment Integration",
            "✅ Notifications",
            "✅ Reviews & Ratings"
        ]
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    from database import check_database_health
    
    db_health = await check_database_health()
    
    overall_status = "healthy" if all(
        h["status"] in ["healthy", "disabled"] for h in db_health.values()
    ) else "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.APP_VERSION,
        "services": db_health
    }

@app.get("/api/stats")
async def get_stats():
    """Get platform statistics"""
    from database import get_collection_stats
    
    stats = await get_collection_stats()
    
    # Add service request stats
    db = get_db()
    try:
        service_request_count = await db.service_requests.count_documents({})
        proposal_count = await db.proposals.count_documents({})
        stats["service_requests"] = service_request_count
        stats["proposals"] = proposal_count
    except Exception as e:
        logger.warning(f"⚠️ Failed to get service request stats: {e}")
    
    return {
        "platform": settings.APP_NAME,
        "statistics": stats,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============ WEBSOCKET FOR CHAT ============
@app.websocket("/ws/chat/{user_id}")
async def chat_websocket(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat"""
    await connection_manager.connect(websocket, user_id)
    db = get_db()
    
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            message_text = data.get("message", "")
            file_url = data.get("file_url")
            file_type = data.get("file_type")
            file_name = data.get("file_name")
            
            # Create message document
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
            
            # Save message to database
            await db.messages.insert_one(message_doc.copy())
            
            # Send to receiver via WebSocket
            ws_message = {"type": "chat", "data": message_doc}
            await connection_manager.send_personal_message(receiver_id, ws_message)
            
            # Echo back to sender
            await websocket.send_json(ws_message)
            
            # Send notification
            try:
                sender = await db.users.find_one({"id": user_id}, {"_id": 0})
                if sender:
                    await notification_service.send_message_notification(
                        sender['name'],
                        receiver_id,
                        message_text
                    )
            except Exception as e:
                logger.warning(f"⚠️ Message notification failed: {e}")
            
            logger.debug(f"💬 Message from {user_id} to {receiver_id}")
    
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {user_id}")
        await connection_manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"❌ WebSocket error for {user_id}: {e}")
        await connection_manager.disconnect(websocket, user_id)

# ============ BOOKING & AVAILABILITY ROUTES ============

@app.post("/api/availability")
async def set_service_availability(
    availability_data: AvailabilityCreate,
    current_user: User = Depends(get_current_user)
):
    """Set weekly availability for a service"""
    db = get_db()
    
    # Verify service ownership
    service = await db.listings.find_one({
        "id": availability_data.service_id,
        "seller_id": current_user.id
    }, {"_id": 0})
    
    if not service:
        raise HTTPException(status_code=403, detail="Not authorized to modify this service")
    
    # Validate day_of_week
    if not 0 <= availability_data.day_of_week <= 6:
        raise HTTPException(status_code=400, detail="day_of_week must be 0-6 (0=Monday, 6=Sunday)")
    
    try:
        # Use booking service
        availability = await booking_service.set_availability(
            service_id=availability_data.service_id,
            provider_id=current_user.id,
            day_of_week=availability_data.day_of_week,
            time_slots=availability_data.time_slots
        )
        
        return {
            "message": "Availability saved successfully",
            "availability": availability.model_dump()
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to set availability: {e}")
        raise HTTPException(status_code=500, detail="Failed to save availability")

@app.get("/api/availability/{service_id}")
async def get_service_availability(service_id: str):
    """Get weekly availability for a service"""
    try:
        availability = await booking_service.get_availability(service_id)
        return [a.model_dump() for a in availability]
    except Exception as e:
        logger.error(f"❌ Failed to get availability: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve availability")

@app.delete("/api/availability/{service_id}/{day_of_week}")
async def delete_service_availability(
    service_id: str,
    day_of_week: int,
    current_user: User = Depends(get_current_user)
):
    """Delete availability for a specific day"""
    db = get_db()
    
    # Verify ownership
    service = await db.listings.find_one({
        "id": service_id,
        "seller_id": current_user.id
    }, {"_id": 0})
    
    if not service:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        deleted = await booking_service.delete_availability(
            service_id, current_user.id, day_of_week
        )
        
        if deleted:
            return {"message": "Availability deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Availability not found")
    
    except Exception as e:
        logger.error(f"❌ Failed to delete availability: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete availability")

@app.get("/api/bookings/available-slots/{service_id}")
async def get_available_slots_api(service_id: str, date: str):
    """Get all available time slots for a specific date"""
    try:
        # Parse date
        booking_date = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Check if date is in the past
    if booking_date.date() < datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="Cannot book dates in the past")
    
    try:
        slots = await booking_service.get_available_slots(service_id, booking_date)
        
        return {
            "service_id": service_id,
            "date": date,
            "day_of_week": booking_date.weekday(),
            "day_name": booking_date.strftime("%A"),
            "slots": slots,
            "total_slots": len(slots),
            "available_count": len([s for s in slots if s['available']])
        }
    
    except Exception as e:
        logger.error(f"❌ Failed to get available slots: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve available slots")

@app.post("/api/bookings/lock-slot")
async def lock_booking_slot(
    payload: Dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Lock a time slot temporarily (5 minutes) while user completes booking"""
    service_id = payload.get("service_id")
    start_time_str = payload.get("start_time")
    
    if not service_id or not start_time_str:
        raise HTTPException(
            status_code=400,
            detail="service_id and start_time are required"
        )
    
    try:
        start_time = datetime.fromisoformat(start_time_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start_time format")
    
    db = get_db()
    
    # Check if slot is already booked
    existing = await db.bookings.find_one({
        "service_id": service_id,
        "start_time": start_time.isoformat(),
        "status": {"$ne": "cancelled"}
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Time slot is already booked")
    
    # Check if slot is locked by someone else
    if booking_service.is_slot_locked(service_id, start_time):
        lock_info = booking_service.get_lock_info(service_id, start_time)
        if lock_info and lock_info.get("user_id") != current_user.id:
            raise HTTPException(
                status_code=409,
                detail=f"Time slot is currently being booked. Try again in {lock_info.get('expires_in', 0)} seconds."
            )
    
    # Acquire lock
    if not booking_service.lock_slot(service_id, start_time, current_user.id, timeout=300):
        raise HTTPException(status_code=409, detail="Failed to acquire slot lock")
    
    return {
        "message": "Slot locked successfully",
        "expires_in_seconds": 300,
        "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=300)).isoformat()
    }

@app.post("/api/bookings/create")
async def create_booking_api(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new booking"""
    db = get_db()
    
    # Only buyers can create bookings
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can create bookings")
    
    # Get service details
    service = await db.listings.find_one({"id": booking_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if service.get("type") != "service":
        raise HTTPException(status_code=400, detail="Can only book services, not products")
    
    try:
        # Create booking using booking service
        booking = await booking_service.create_booking(
            service_id=booking_data.service_id,
            provider_id=service["seller_id"],
            provider_name=service.get("seller_name", "Provider"),
            client_id=current_user.id,
            client_name=current_user.name,
            start_time=booking_data.start_time,
            duration_minutes=booking_data.duration_minutes,
            price=float(service.get("price", 0)),
            notes=booking_data.notes,
            service_title=service.get("title", "Service")
        )
        
        # Convert booking to dict for notifications
        booking_dict = booking.model_dump()
        booking_dict['timestamp'] = booking.created_at.isoformat()
        booking_dict['start_time'] = booking.start_time.isoformat()
        booking_dict['end_time'] = booking.end_time.isoformat()
        
        # Send notifications
        try:
            await notification_service.send_booking_notifications(booking_dict)
            logger.info(f"✅ Notifications sent for booking {booking.id}")
        except Exception as e:
            logger.warning(f"⚠️ Notification failed: {e}")
        
        return {
            "message": "Booking created successfully",
            "booking": booking_dict
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Booking creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create booking")

@app.get("/api/bookings/my-bookings")
async def get_my_bookings_api(
    status: Optional[str] = None,
    upcoming_only: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get user's bookings (as client or provider)"""
    try:
        bookings = await booking_service.get_user_bookings(
            user_id=current_user.id,
            role=current_user.role,
            status=status,
            upcoming_only=upcoming_only
        )
        
        # Convert to dict
        bookings_data = []
        for b in bookings:
            b_dict = b.model_dump()
            b_dict['created_at'] = b.created_at.isoformat()
            b_dict['start_time'] = b.start_time.isoformat()
            b_dict['end_time'] = b.end_time.isoformat()
            bookings_data.append(b_dict)
        
        return {
            "bookings": bookings_data,
            "total": len(bookings_data),
            "role": current_user.role
        }
    
    except Exception as e:
        logger.error(f"❌ Failed to get bookings: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve bookings")

@app.post("/api/bookings/{booking_id}/cancel")
async def cancel_booking_api(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a booking"""
    try:
        result = await booking_service.cancel_booking(
            booking_id=booking_id,
            user_id=current_user.id,
            role=current_user.role
        )
        
        # Send cancellation notification
        try:
            booking = await booking_service.get_booking_by_id(booking_id)
            if booking:
                booking_dict = booking.model_dump()
                booking_dict['created_at'] = booking.created_at.isoformat()
                booking_dict['start_time'] = booking.start_time.isoformat()
                booking_dict['end_time'] = booking.end_time.isoformat()
                
                await notification_service.send_cancellation_notification(
                    booking_dict,
                    current_user.id
                )
        except Exception as e:
            logger.warning(f"⚠️ Cancellation notification failed: {e}")
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to cancel booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel booking")

@app.post("/api/bookings/{booking_id}/complete")
async def complete_booking_api(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a booking as completed (provider only)"""
    try:
        await booking_service.complete_booking(booking_id, current_user.id)
        
        return {
            "message": "Booking marked as completed",
            "booking_id": booking_id
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Failed to complete booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete booking")

# ============ RUN APPLICATION ============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )










# """
# NovoMarket Backend Server
# Location: ./backend/server.py
# """

# from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, WebSocket, WebSocketDisconnect, UploadFile, File
# from fastapi.responses import JSONResponse
# from fastapi.staticfiles import StaticFiles
# from dotenv import load_dotenv
# from starlette.middleware.cors import CORSMiddleware
# from motor.motor_asyncio import AsyncIOMotorClient
# import os
# import logging
# import shutil
# from pathlib import Path
# from typing import List, Optional, Dict
# import uuid
# from datetime import datetime, timezone, timedelta
# from passlib.context import CryptContext
# import jwt
# import stripe
# import json
# import secrets

# # Import all models from models.py
# from models import (
#     User, UserCreate, UserLogin,
#     Listing, ListingCreate, ListingUpdate,
#     Review, ReviewCreate,
#     Order,
#     Message, MessageCreate, Thread,
#     Wishlist,
#     PaymentTransaction, CheckoutSessionResponse, CheckoutStatusResponse,
#     TimeSlot, ServiceAvailability, Booking, BookingCreate, AvailabilityCreate
# )


# # backend/main.py - ADD THESE NOTIFICATION ROUTES
# # Add this import at the top with other imports

# # from services.notification_service import create_notification, send_booking_notifications
# from models import Notification, NotificationType
# # Import notification functions
# import sys
# import os
# sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# # Now import notification service
# try:
#     from services.notification_service import create_notification, send_booking_notifications
#     print("✅ Notification service imported successfully")
# except ImportError as e:
#     print(f"⚠️  Notification service import failed: {e}")
#     # Define dummy functions if import fails
#     async def create_notification(*args, **kwargs):
#         pass
#     async def send_booking_notifications(*args, **kwargs):
#         pass



# from fastapi.middleware.cors import CORSMiddleware

# # app = FastAPI()




# ROOT_DIR = Path(__file__).parent
# load_dotenv(ROOT_DIR / '.env')

# # MongoDB connection
# mongo_url = os.environ['MONGO_URL']
# client = AsyncIOMotorClient(mongo_url)
# db = client[os.environ['DB_NAME']]

# # Security
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# JWT_SECRET = os.environ.get('JWT_SECRET')
# JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')

# # Stripe
# STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
# STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
# stripe.api_key = STRIPE_API_KEY

# # Create uploads directory
# UPLOAD_DIR = ROOT_DIR / "uploads"
# UPLOAD_DIR.mkdir(exist_ok=True)

# # Create the main app
# app = FastAPI()
# api_router = APIRouter(prefix="/api")



# # 👇 Add this
# origins = [
#     "http://localhost:3000",   # React dev server
#     "http://127.0.0.1:3000",
#     "http://localhost:5173",   # in case you're using Vite
#     "http://127.0.0.1:5173"
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,           # URLs allowed to call your API
#     allow_credentials=True,
#     allow_methods=["*"],             # allow all HTTP methods
#     allow_headers=["*"],             # allow all headers
# )




# # ============ WebSocket Connection Manager ============
# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: Dict[str, List[WebSocket]] = {}

#     async def connect(self, websocket: WebSocket, user_id: str):
#         await websocket.accept()
#         if user_id not in self.active_connections:
#             self.active_connections[user_id] = []
#         self.active_connections[user_id].append(websocket)
#         print(f"✅ User connected: {user_id}")
#         await self.broadcast_online_users()

#     async def disconnect(self, websocket: WebSocket, user_id: str):
#         if user_id in self.active_connections:
#             self.active_connections[user_id].remove(websocket)
#             if not self.active_connections[user_id]:
#                 del self.active_connections[user_id]
#         print(f"❌ User disconnected: {user_id}")
#         await self.broadcast_online_users()

#     async def send_personal_message(self, receiver_id: str, message: dict):
#         if receiver_id in self.active_connections:
#             for connection in self.active_connections[receiver_id]:
#                 try:
#                     await connection.send_text(json.dumps(message))
#                 except:
#                     pass

#     async def broadcast(self, message: dict):
#         for user_connections in self.active_connections.values():
#             for connection in user_connections:
#                 try:
#                     await connection.send_text(json.dumps(message))
#                 except:
#                     pass

#     async def broadcast_online_users(self):
#         online_users = list(self.active_connections.keys())
#         message = {"type": "online_users", "users": online_users}
#         await self.broadcast(message)

# connection_manager = ConnectionManager()

# # ============ Auth Helpers ============

# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     return pwd_context.verify(plain_password, hashed_password)

# def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
#     to_encode = data.copy()
#     expire = datetime.now(timezone.utc) + expires_delta
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

# async def get_current_user(authorization: str = Header(None)):
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Not authenticated")
    
#     token = authorization.split(" ")[1]
#     try:
#         payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
#         user_id = payload.get("user_id")
#         if not user_id:
#             raise HTTPException(status_code=401, detail="Invalid token")
        
#         user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
#         if not user:
#             raise HTTPException(status_code=404, detail="User not found")
        
#         return User(**user)
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code=401, detail="Invalid token")

# # ============ Booking Helper Functions ============

# def generate_meeting_link(booking_id: str) -> str:
#     """Generate a unique meeting link for a booking"""
#     token = secrets.token_urlsafe(16)
#     return f"https://meet.novomarket.com/{booking_id}/{token}"

# async def get_available_slots(service_id: str, date: datetime) -> List[dict]:
#     """Get available time slots for a specific date"""
#     day_of_week = date.weekday()  # 0=Monday, 6=Sunday
    
#     # Get weekly availability for this day
#     availability = await db.service_availability.find_one({
#         "service_id": service_id,
#         "day_of_week": day_of_week
#     }, {"_id": 0})
    
#     if not availability:
#         return []
    
#     # Get all bookings for this date
#     start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
#     end_of_day = start_of_day + timedelta(days=1)
    
#     bookings = await db.bookings.find({
#         "service_id": service_id,
#         "start_time": {
#             "$gte": start_of_day.isoformat(),
#             "$lt": end_of_day.isoformat()
#         },
#         "status": {"$in": ["pending", "confirmed"]}
#     }, {"_id": 0}).to_list(100)
    
#     booked_times = set()
#     for booking in bookings:
#         start = datetime.fromisoformat(booking["start_time"])
#         booked_times.add(start.strftime("%H:%M"))
    
#     # Build available slots
#     available = []
#     for slot in availability.get("time_slots", []):
#         if slot["is_available"] and slot["start_time"] not in booked_times:
#             # Convert to full datetime
#             hour, minute = map(int, slot["start_time"].split(":"))
#             slot_datetime = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
#             # Only show future slots
#             if slot_datetime > datetime.now(timezone.utc):
#                 available.append({
#                     "start_time": slot["start_time"],
#                     "end_time": slot["end_time"],
#                     "datetime": slot_datetime.isoformat(),
#                     "is_available": True
#                 })
    
#     return available

# # ============ AUTH ROUTES ============

# @api_router.post("/auth/register", response_model=dict)
# async def register(user_data: UserCreate):
#     existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already registered")
    
#     user = User(
#         email=user_data.email,
#         name=user_data.name,
#         role=user_data.role
#     )
    
#     user_dict = user.model_dump()
#     user_dict['timestamp'] = user_dict.pop('created_at').isoformat()
#     user_dict['password'] = hash_password(user_data.password)
    
#     await db.users.insert_one(user_dict)
    
#     token = create_access_token({"user_id": user.id, "email": user.email})
#     return {"token": token, "user": user.model_dump()}

# @api_router.post("/auth/login", response_model=dict)
# async def login(credentials: UserLogin):
#     user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
#     if not user or not verify_password(credentials.password, user.get('password', '')):
#         raise HTTPException(status_code=401, detail="Invalid credentials")
    
#     user.pop('password', None)
#     if isinstance(user.get('timestamp'), str):
#         user['created_at'] = datetime.fromisoformat(user.pop('timestamp'))
    
#     token = create_access_token({"user_id": user['id'], "email": user['email']})
#     return {"token": token, "user": User(**user).model_dump()}

# @api_router.get("/auth/me", response_model=User)
# async def get_me(current_user: User = Depends(get_current_user)):
#     return current_user

# # ============ LISTING ROUTES ============

# @api_router.post("/listings", response_model=Listing)
# async def create_listing(listing_data: ListingCreate, current_user: User = Depends(get_current_user)):
#     if current_user.role != "seller":
#         raise HTTPException(status_code=403, detail="Only sellers can create listings")
    
#     listing = Listing(
#         seller_id=current_user.id,
#         seller_name=current_user.name,
#         **listing_data.model_dump()
#     )
    
#     listing_dict = listing.model_dump()
#     listing_dict['timestamp'] = listing_dict.pop('created_at').isoformat()
    
#     await db.listings.insert_one(listing_dict)
#     return listing

# @api_router.get("/listings", response_model=List[Listing])
# async def get_listings(category: Optional[str] = None, search: Optional[str] = None, limit: int = 50):
#     query = {}
#     if category:
#         query['category'] = category
#     if search:
#         query['$or'] = [
#             {'title': {'$regex': search, '$options': 'i'}},
#             {'description': {'$regex': search, '$options': 'i'}}
#         ]
    
#     listings = await db.listings.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
#     for p in listings:
#         if isinstance(p.get('timestamp'), str):
#             p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
    
#     return [Listing(**p) for p in listings]

# @api_router.get("/listings/{listing_id}", response_model=Listing)
# async def get_listing(listing_id: str):
#     listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     if isinstance(listing.get('timestamp'), str):
#         listing['created_at'] = datetime.fromisoformat(listing.pop('timestamp'))
    
#     return Listing(**listing)

# @api_router.put("/listings/{listing_id}", response_model=Listing)
# async def update_listing(listing_id: str, listing_data: ListingUpdate, current_user: User = Depends(get_current_user)):
#     listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     if listing['seller_id'] != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     update_data = {k: v for k, v in listing_data.model_dump().items() if v is not None}
#     await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
#     updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if isinstance(updated.get('timestamp'), str):
#         updated['created_at'] = datetime.fromisoformat(updated.pop('timestamp'))
    
#     return Listing(**updated)

# @api_router.delete("/listings/{listing_id}")
# async def delete_listing(listing_id: str, current_user: User = Depends(get_current_user)):
#     listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     if listing['seller_id'] != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     await db.listings.delete_one({"id": listing_id})
#     return {"message": "Listing deleted"}

# # ============ REVIEW ROUTES ============

# @api_router.post("/reviews", response_model=Review)
# async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
#     listing = await db.listings.find_one({"id": review_data.listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     review = Review(
#         user_id=current_user.id,
#         user_name=current_user.name,
#         **review_data.model_dump()
#     )
    
#     review_dict = review.model_dump()
#     review_dict['timestamp'] = review_dict.pop('created_at').isoformat()
    
#     await db.reviews.insert_one(review_dict)
    
#     reviews = await db.reviews.find({"listing_id": review_data.listing_id}, {"_id": 0}).to_list(1000)
#     avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
#     await db.listings.update_one(
#         {"id": review_data.listing_id},
#         {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
#     )
    
#     return review

# @api_router.get("/reviews/{listing_id}", response_model=List[Review])
# async def get_reviews(listing_id: str):
#     reviews = await db.reviews.find({"listing_id": listing_id}, {"_id": 0}).to_list(1000)
    
#     for r in reviews:
#         if isinstance(r.get('timestamp'), str):
#             r['created_at'] = datetime.fromisoformat(r.pop('timestamp'))
    
#     return [Review(**r) for r in reviews]

# # ============ ORDER ROUTES ============

# @api_router.post("/orders", response_model=Order)
# async def create_order(listing_id: str, quantity: int, current_user: User = Depends(get_current_user)):
#     listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     if listing.get('type') == "product" and listing.get('stock', 0) < quantity:
#         raise HTTPException(status_code=400, detail="Insufficient stock")
    
#     order = Order(
#         buyer_id=current_user.id,
#         buyer_name=current_user.name,
#         seller_id=listing['seller_id'],
#         listing_id=listing_id,
#         listing_title=listing['title'],
#         quantity=quantity,
#         total_amount=listing['price'] * quantity
#     )
    
#     order_dict = order.model_dump()
#     order_dict['timestamp'] = order_dict.pop('created_at').isoformat()
    
#     await db.orders.insert_one(order_dict)
#     return order

# @api_router.get("/orders", response_model=List[Order])
# async def get_orders(current_user: User = Depends(get_current_user)):
#     query = {"buyer_id": current_user.id} if current_user.role == "buyer" else {"seller_id": current_user.id}
#     orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
#     for o in orders:
#         if isinstance(o.get('timestamp'), str):
#             o['created_at'] = datetime.fromisoformat(o.pop('timestamp'))
    
#     return [Order(**o) for o in orders]

# # ============ BOOKING ROUTES ============

# @api_router.post("/bookings/availability")
# async def set_service_availability(
#     availability_data: AvailabilityCreate,
#     current_user: User = Depends(get_current_user)
# ):
#     """Set weekly availability for a service"""
#     # Verify service ownership
#     service = await db.listings.find_one(
#         {"id": availability_data.service_id, "seller_id": current_user.id},
#         {"_id": 0}
#     )
#     if not service:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     # Validate day_of_week
#     if not 0 <= availability_data.day_of_week <= 6:
#         raise HTTPException(status_code=400, detail="day_of_week must be 0-6")
    
#     # Check if availability already exists for this day
#     existing = await db.service_availability.find_one({
#         "service_id": availability_data.service_id,
#         "day_of_week": availability_data.day_of_week
#     }, {"_id": 0})
    
#     time_slots_dict = [slot.model_dump() for slot in availability_data.time_slots]
    
#     if existing:
#         # Update existing
#         await db.service_availability.update_one(
#             {"id": existing["id"]},
#             {"$set": {"time_slots": time_slots_dict}}
#         )
#         result = {**existing, "time_slots": time_slots_dict}
#     else:
#         # Create new
#         availability_dict = {
#             "id": str(uuid.uuid4()),
#             "service_id": availability_data.service_id,
#             "provider_id": current_user.id,
#             "day_of_week": availability_data.day_of_week,
#             "time_slots": time_slots_dict,
#             "timestamp": datetime.now(timezone.utc).isoformat()
#         }
#         await db.service_availability.insert_one(availability_dict)
#         result = availability_dict
    
#     return {"message": "Availability set successfully", "availability": result}

# @api_router.get("/bookings/availability/{service_id}")
# async def get_service_availability(service_id: str):
#     """Get weekly availability for a service"""
#     availability = await db.service_availability.find(
#         {"service_id": service_id},
#         {"_id": 0}
#     ).to_list(7)  # Max 7 days
    
#     return {"availability": availability}

# @api_router.get("/bookings/available-slots/{service_id}")
# async def get_service_available_slots(service_id: str, date: str):
#     """Get available time slots for a specific date"""
#     try:
#         booking_date = datetime.strptime(date, "%Y-%m-%d")
#         booking_date = booking_date.replace(tzinfo=timezone.utc)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
#     slots = await get_available_slots(service_id, booking_date)
#     return {"date": date, "slots": slots}

# @api_router.post("/bookings/create")
# async def create_new_booking(
#     booking_data: BookingCreate,
#     current_user: User = Depends(get_current_user)
# ):
#     """Create a new booking"""
#     if current_user.role != "buyer":
#         raise HTTPException(status_code=403, detail="Only buyers can create bookings")
    
#     # Get service details
#     service = await db.listings.find_one({"id": booking_data.service_id}, {"_id": 0})
#     if not service:
#         raise HTTPException(status_code=404, detail="Service not found")
    
#     if service.get("type") != "service":
#         raise HTTPException(status_code=400, detail="Can only book services, not products")
    
#     # Check for conflicts
#     start_time = booking_data.start_time
#     end_time = start_time + timedelta(minutes=booking_data.duration_minutes)
    
#     conflicts = await db.bookings.find({
#         "service_id": booking_data.service_id,
#         "start_time": start_time.isoformat(),
#         "status": {"$in": ["pending", "confirmed"]}
#     }, {"_id": 0}).to_list(1)
    
#     if conflicts:
#         raise HTTPException(status_code=400, detail="This time slot is already booked")
    
#     # Create booking
#     booking_id = str(uuid.uuid4())
#     booking_dict = {
#         "id": booking_id,
#         "service_id": booking_data.service_id,
#         "service_title": service["title"],
#         "provider_id": service["seller_id"],
#         "provider_name": service["seller_name"],
#         "client_id": current_user.id,
#         "client_name": current_user.name,
#         "start_time": start_time.isoformat(),
#         "end_time": end_time.isoformat(),
#         "duration_minutes": booking_data.duration_minutes,
#         "price": service["price"],
#         "status": "confirmed",
#         "notes": booking_data.notes,
#         "timestamp": datetime.now(timezone.utc).isoformat()
#     }
    
#     # Generate meeting link
#     meeting_link = generate_meeting_link(booking_id)
#     booking_dict["meeting_link"] = meeting_link
    
#     await db.bookings.insert_one(booking_dict)
    
#     return {
#         "message": "Booking created successfully",
#         "booking": booking_dict
#     }

# @api_router.get("/bookings/my-bookings")
# async def get_my_bookings(
#     status: Optional[str] = None,
#     current_user: User = Depends(get_current_user)
# ):
#     """Get user's bookings (as client or provider)"""
#     query = {}
#     if current_user.role == "buyer":
#         query["client_id"] = current_user.id
#     else:
#         query["provider_id"] = current_user.id
    
#     if status:
#         query["status"] = status
    
#     bookings = await db.bookings.find(query, {"_id": 0}).sort("start_time", -1).to_list(100)
    
#     # Convert timestamp to created_at
#     for booking in bookings:
#         if "timestamp" in booking:
#             booking["created_at"] = booking.pop("timestamp")
    
#     return {"bookings": bookings}

# @api_router.post("/bookings/{booking_id}/cancel")
# async def cancel_user_booking(
#     booking_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """Cancel a booking"""
#     booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    
#     if not booking:
#         raise HTTPException(status_code=404, detail="Booking not found")
    
#     if booking["client_id"] != current_user.id and booking["provider_id"] != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    
#     await db.bookings.update_one(
#         {"id": booking_id},
#         {"$set": {"status": "cancelled"}}
#     )
    
#     return {"message": "Booking cancelled successfully"}

# @api_router.post("/bookings/{booking_id}/complete")
# async def complete_booking(
#     booking_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """Mark a booking as completed (provider only)"""
#     booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    
#     if not booking:
#         raise HTTPException(status_code=404, detail="Booking not found")
    
#     if booking["provider_id"] != current_user.id:
#         raise HTTPException(status_code=403, detail="Only the provider can mark as completed")
    
#     await db.bookings.update_one(
#         {"id": booking_id},
#         {"$set": {"status": "completed"}}
#     )
    
#     return {"message": "Booking marked as completed"}

# # ============ MESSAGE & CHAT ROUTES ============

# @api_router.get("/users", response_model=List[User])
# async def get_users(current_user: User = Depends(get_current_user)):
#     users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
#     filtered_users = [User(**u) for u in users if u["id"] != current_user.id]
#     return filtered_users

# @api_router.get("/messages/{other_user_id}", response_model=List[Message])
# async def get_messages(other_user_id: str, current_user: User = Depends(get_current_user)):
#     messages = await db.messages.find(
#         {"$or": [
#             {"sender_id": current_user.id, "receiver_id": other_user_id},
#             {"sender_id": other_user_id, "receiver_id": current_user.id}
#         ]},
#         {"_id": 0}
#     ).to_list(10000)
    
#     await db.messages.update_many(
#         {"sender_id": other_user_id, "receiver_id": current_user.id},
#         {"$set": {"read": True}}
#     )
    
#     for m in messages:
#         if isinstance(m.get('timestamp'), str):
#             m['created_at'] = datetime.fromisoformat(m.pop('timestamp'))
    
#     return sorted([Message(**m) for m in messages], key=lambda x: x.created_at)

# @api_router.post("/upload")
# async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
#     try:
#         file.file.seek(0, 2)
#         file_size = file.file.tell()
#         file.file.seek(0)
        
#         if file_size > 10 * 1024 * 1024:
#             raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
#         file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
#         unique_filename = f"{uuid.uuid4()}.{file_extension}"
#         file_path = UPLOAD_DIR / unique_filename
        
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
        
#         file_url = f"http://localhost:8000/uploads/{unique_filename}"
#         return {"file_url": file_url, "file_name": file.filename}
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# # ============ WISHLIST ROUTES ============

# @api_router.post("/wishlist/{listing_id}")
# async def add_to_wishlist(listing_id: str, current_user: User = Depends(get_current_user)):
#     existing = await db.wishlist.find_one({"user_id": current_user.id, "listing_id": listing_id}, {"_id": 0})
#     if existing:
#         return {"message": "Already in wishlist"}
    
#     wishlist = Wishlist(user_id=current_user.id, listing_id=listing_id)
#     wishlist_dict = wishlist.model_dump()
#     wishlist_dict['timestamp'] = wishlist_dict.pop('created_at').isoformat()
    
#     await db.wishlist.insert_one(wishlist_dict)
#     return {"message": "Added to wishlist"}

# @api_router.delete("/wishlist/{listing_id}")
# async def remove_from_wishlist(listing_id: str, current_user: User = Depends(get_current_user)):
#     await db.wishlist.delete_one({"user_id": current_user.id, "listing_id": listing_id})
#     return {"message": "Removed from wishlist"}

# @api_router.get("/wishlist", response_model=List[Listing])
# async def get_wishlist(current_user: User = Depends(get_current_user)):
#     wishlist_items = await db.wishlist.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
#     listing_ids = [item['listing_id'] for item in wishlist_items]
    
#     listings = await db.listings.find({"id": {"$in": listing_ids}}, {"_id": 0}).to_list(1000)
    
#     for p in listings:
#         if isinstance(p.get('timestamp'), str):
#             p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
    
#     return [Listing(**p) for p in listings]

# # ============ PAYMENT ROUTES ============

# @api_router.post("/checkout/session", response_model=CheckoutSessionResponse)
# async def create_checkout_session(order_id: str, request: Request, current_user: User = Depends(get_current_user)):
#     order = await db.orders.find_one({"id": order_id}, {"_id": 0})
#     if not order:
#         raise HTTPException(status_code=404, detail="Order not found")
    
#     if order['buyer_id'] != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     host_url = str(request.base_url)
#     success_url = f"{host_url}payment-success?session_id={{CHECKOUT_SESSION_ID}}"
#     cancel_url = f"{host_url}payment-cancel"

#     try:
#         checkout_session = stripe.checkout.Session.create(
#             line_items=[{
#                 'price_data': {
#                     'currency': 'usd',
#                     'product_data': {'name': order['listing_title']},
#                     'unit_amount': int(order['total_amount'] * 100),
#                 },
#                 'quantity': order['quantity'],
#             }],
#             mode='payment',
#             success_url=success_url,
#             cancel_url=cancel_url,
#             metadata={"order_id": order_id, "buyer_id": current_user.id}
#         )

#         transaction = PaymentTransaction(
#             session_id=checkout_session.id,
#             order_id=order_id,
#             buyer_id=current_user.id,
#             amount=float(order['total_amount']),
#             currency="usd",
#             payment_status="pending",
#             metadata={"order_id": order_id}
#         )
        
#         transaction_dict = transaction.model_dump()
#         transaction_dict['timestamp'] = transaction_dict.pop('created_at').isoformat()
        
#         await db.payment_transactions.insert_one(transaction_dict)
#         await db.orders.update_one({"id": order_id}, {"$set": {"session_id": checkout_session.id}})
        
#         return CheckoutSessionResponse(session_id=checkout_session.id, url=checkout_session.url)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @api_router.get("/checkout/status/{session_id}", response_model=CheckoutStatusResponse)
# async def get_checkout_status(session_id: str, current_user: User = Depends(get_current_user)):
#     try:
#         session = stripe.checkout.Session.retrieve(session_id)
#         payment_status = session.payment_status

#         if payment_status == "paid":
#             transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
#             if transaction and transaction['payment_status'] != "paid":
#                 await db.payment_transactions.update_one(
#                     {"session_id": session_id},
#                     {"$set": {"payment_status": "paid"}}
#                 )
#                 await db.orders.update_one(
#                     {"id": transaction['order_id']},
#                     {"$set": {"payment_status": "paid", "status": "confirmed"}}
#                 )
                
#                 order = await db.orders.find_one({"id": transaction['order_id']}, {"_id": 0})
#                 if order:
#                     await db.listings.update_one(
#                         {"id": order['listing_id']},
#                         {"$inc": {"stock": -order['quantity']}}
#                     )
        
#         return CheckoutStatusResponse(payment_status=payment_status)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @api_router.post("/webhook/stripe")
# async def stripe_webhook(request: Request):
#     payload = await request.body()
#     sig_header = request.headers.get('stripe-signature')

#     try:
#         event = stripe.Webhook.construct_event(
#             payload=payload, sig_header=sig_header, secret=STRIPE_WEBHOOK_SECRET
#         )
#     except:
#         raise HTTPException(status_code=400, detail="Invalid signature")

#     if event['type'] == 'checkout.session.completed':
#         session = event['data']['object']
#         session_id = session['id']
#         payment_status = session['payment_status']

#         if payment_status == "paid":
#             transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
#             if transaction and transaction['payment_status'] != "paid":
#                 await db.payment_transactions.update_one(
#                     {"session_id": session_id},
#                     {"$set": {"payment_status": "paid"}}
#                 )
#                 await db.orders.update_one(
#                     {"id": transaction['order_id']},
#                     {"$set": {"payment_status": "paid", "status": "confirmed"}}
#                 )

#     return {"status": "success"}


# # Add these routes after your existing routes (around line 500+)

# # ============ NOTIFICATION ROUTES ============

# @api_router.get("/notifications")
# async def get_notifications(
#     unread_only: bool = False,
#     current_user: User = Depends(get_current_user)
# ):
#     """Get user notifications"""
#     query = {"user_id": current_user.id}
#     if unread_only:
#         query["read"] = False
    
#     notifications = await db.notifications.find(
#         query,
#         {"_id": 0}
#     ).sort("timestamp", -1).limit(50).to_list(50)
    
#     # Convert timestamps
#     for n in notifications:
#         if isinstance(n.get("timestamp"), str):
#             n["created_at"] = n.pop("timestamp")
    
#     return {"notifications": notifications}

# @api_router.post("/notifications/{notif_id}/mark-read")
# async def mark_notification_read(
#     notif_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """Mark notification as read"""
#     result = await db.notifications.update_one(
#         {"id": notif_id, "user_id": current_user.id},
#         {"$set": {"read": True}}
#     )
    
#     if result.modified_count == 0:
#         raise HTTPException(status_code=404, detail="Notification not found")
    
#     return {"message": "Marked as read"}

# @api_router.post("/notifications/mark-all-read")
# async def mark_all_notifications_read(
#     current_user: User = Depends(get_current_user)
# ):
#     """Mark all notifications as read"""
#     result = await db.notifications.update_many(
#         {"user_id": current_user.id, "read": False},
#         {"$set": {"read": True}}
#     )
    
#     return {
#         "message": f"Marked {result.modified_count} notifications as read",
#         "count": result.modified_count
#     }

# @api_router.post("/notifications/test")
# async def create_test_notification(
#     current_user: User = Depends(get_current_user)
# ):
#     """Create a test notification (for testing only)"""
#     notification = await create_notification(
#         user_id=current_user.id,
#         notification_type=NotificationType.BOOKING_CONFIRMED,
#         title="Test Notification",
#         message="This is a test notification to verify the system is working!",
#         link="/buyer-dashboard",
#         data={"test": True}
#     )
    
#     return {
#         "message": "Test notification created",
#         "notification": notification
#     }

# app.include_router(api_router)
# app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# @app.get("/")
# def root():
#     return {"message": "NovoMarket API is running 🚀"}



# # ============ WEBSOCKET FOR CHAT ============

# @app.websocket("/ws/chat/{user_id}")
# async def chat_endpoint(websocket: WebSocket, user_id: str):
#     await connection_manager.connect(websocket, user_id)
    
#     try:
#         while True:
#             data = await websocket.receive_json()
#             receiver_id = data.get("receiver_id")
#             message_text = data.get("message", "")
#             file_url = data.get("file_url")
#             file_type = data.get("file_type")
#             file_name = data.get("file_name")

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
            
#             await db.messages.insert_one(message_doc.copy())

#             ws_message = {"type": "chat", "data": message_doc}
            
#             await connection_manager.send_personal_message(receiver_id, ws_message)
#             await websocket.send_json(ws_message)

#     except WebSocketDisconnect:
#         await connection_manager.disconnect(websocket, user_id)
#     except Exception as e:
#         print(f"WebSocket error: {e}")
#         await connection_manager.disconnect(websocket, user_id)

# # ============ APP SETUP ============

# # Include router and mount static files
# app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
# app.include_router(api_router)

# app.add_middleware(
#     CORSMiddleware,
#     allow_credentials=True,
#     allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# @app.on_event("shutdown")
# async def shutdown_db_client():
#     client.close()

# # Run the application
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)





























# from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, WebSocket, WebSocketDisconnect, UploadFile, File
# from fastapi.responses import JSONResponse
# from fastapi.staticfiles import StaticFiles
# from dotenv import load_dotenv
# from starlette.middleware.cors import CORSMiddleware
# from motor.motor_asyncio import AsyncIOMotorClient
# import os
# import logging
# import shutil
# from pathlib import Path
# from pydantic import BaseModel, Field, ConfigDict, EmailStr
# from typing import List, Optional, Dict, Any
# import uuid
# from datetime import datetime, timezone, timedelta
# from passlib.context import CryptContext
# import jwt
# import stripe
# import json
# import secrets


# # Import all models from models.py
# from models import (
#     User, UserCreate, UserLogin,
#     Listing, ListingCreate, ListingUpdate,
#     Review, ReviewCreate,
#     Order,
#     Message, MessageCreate, Thread,
#     Wishlist,
#     PaymentTransaction, CheckoutSessionResponse, CheckoutStatusResponse,
#     TimeSlot, ServiceAvailability, Booking, BookingCreate, AvailabilityCreate
# )   


# ROOT_DIR = Path(__file__).parent
# load_dotenv(ROOT_DIR / '.env')

# # MongoDB connection
# mongo_url = os.environ['MONGO_URL']
# client = AsyncIOMotorClient(mongo_url)
# db = client[os.environ['DB_NAME']]

# # Security
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# JWT_SECRET = os.environ.get('JWT_SECRET')
# JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')

# # Stripe
# STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
# STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
# stripe.api_key = STRIPE_API_KEY

# # Create uploads directory
# UPLOAD_DIR = ROOT_DIR / "uploads"
# UPLOAD_DIR.mkdir(exist_ok=True)

# # Create the main app
# app = FastAPI()
# api_router = APIRouter(prefix="/api")

# # ============ WebSocket Connection Manager ============
# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: Dict[str, List[WebSocket]] = {}

#     async def connect(self, websocket: WebSocket, user_id: str):
#         await websocket.accept()
#         if user_id not in self.active_connections:
#             self.active_connections[user_id] = []
#         self.active_connections[user_id].append(websocket)
#         print(f"✅ User connected: {user_id}")
#         await self.broadcast_online_users()

#     async def disconnect(self, websocket: WebSocket, user_id: str):
#         if user_id in self.active_connections:
#             self.active_connections[user_id].remove(websocket)
#             if not self.active_connections[user_id]:
#                 del self.active_connections[user_id]
#         print(f"❌ User disconnected: {user_id}")
#         await self.broadcast_online_users()

#     async def send_personal_message(self, receiver_id: str, message: dict):
#         if receiver_id in self.active_connections:
#             for connection in self.active_connections[receiver_id]:
#                 try:
#                     await connection.send_text(json.dumps(message))
#                 except:
#                     pass

#     async def broadcast(self, message: dict):
#         for user_connections in self.active_connections.values():
#             for connection in user_connections:
#                 try:
#                     await connection.send_text(json.dumps(message))
#                 except:
#                     pass

#     async def broadcast_online_users(self):
#         online_users = list(self.active_connections.keys())
#         message = {"type": "online_users", "users": online_users}
#         await self.broadcast(message)

# connection_manager = ConnectionManager()

# # # ============ Models ============

# # class User(BaseModel):
# #     model_config = ConfigDict(extra="ignore")
# #     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
# #     email: EmailStr
# #     name: str
# #     role: str = "buyer"
# #     avatar: Optional[str] = None
# #     verified: bool = False
# #     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# # class UserCreate(BaseModel):
# #     email: EmailStr
# #     password: str
# #     name: str
# #     role: str = "buyer"

# # class UserLogin(BaseModel):
# #     email: EmailStr
# #     password: str

# # class Listing(BaseModel):
# #     model_config = ConfigDict(extra="ignore")
# #     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
# #     seller_id: str
# #     seller_name: str
# #     title: str
# #     description: str
# #     price: float
# #     category: str
# #     images: List[str]
# #     tags: List[str] = []
# #     stock: Optional[int] = 1
# #     verified: bool = False
# #     rating: float = 0.0
# #     reviews_count: int = 0
# #     type: str = "product"
# #     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# # class ListingCreate(BaseModel):
# #     title: str
# #     description: str
# #     price: float
# #     category: str
# #     images: List[str]
# #     tags: List[str] = []
# #     stock: Optional[int] = 1
# #     type: str = "product"

# # class ListingUpdate(BaseModel):
# #     title: Optional[str] = None
# #     description: Optional[str] = None
# #     price: Optional[float] = None
# #     category: Optional[str] = None
# #     images: Optional[List[str]] = None
# #     tags: Optional[List[str]] = None
# #     stock: Optional[int] = None
# #     type: Optional[str] = None

# # class Review(BaseModel):
# #     model_config = ConfigDict(extra="ignore")
# #     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
# #     listing_id: str
# #     user_id: str
# #     user_name: str
# #     rating: int
# #     comment: str
# #     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# # class ReviewCreate(BaseModel):
# #     listing_id: str
# #     rating: int
# #     comment: str

# # class Order(BaseModel):
# #     model_config = ConfigDict(extra="ignore")
# #     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
# #     buyer_id: str
# #     buyer_name: str
# #     seller_id: str
# #     listing_id: str
# #     listing_title: str
# #     quantity: int
# #     total_amount: float
# #     status: str = "pending"
# #     payment_status: str = "pending"
# #     session_id: Optional[str] = None
# #     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# # class Message(BaseModel):
# #     model_config = ConfigDict(extra="ignore")
# #     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
# #     sender_id: str
# #     receiver_id: str
# #     listing_id: Optional[str] = None
# #     message: str
# #     file_url: Optional[str] = None
# #     file_type: Optional[str] = None
# #     file_name: Optional[str] = None
# #     read: bool = False
# #     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# # class MessageCreate(BaseModel):
# #     receiver_id: str
# #     listing_id: Optional[str] = None
# #     message: str
# #     file_url: Optional[str] = None
# #     file_type: Optional[str] = None
# #     file_name: Optional[str] = None

# # class Thread(BaseModel):
# #     id: str
# #     other_user_id: str
# #     other_user_name: str
# #     other_user_avatar: Optional[str] = None
# #     last_message: str
# #     last_message_time: datetime
# #     unread_count: int

# # class Wishlist(BaseModel):
# #     model_config = ConfigDict(extra="ignore")
# #     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
# #     user_id: str
# #     listing_id: str
# #     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# # class PaymentTransaction(BaseModel):
# #     model_config = ConfigDict(extra="ignore")
# #     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
# #     session_id: str
# #     order_id: str
# #     buyer_id: str
# #     amount: float
# #     currency: str = "usd"
# #     payment_status: str = "pending"
# #     metadata: Dict[str, Any] = {}
# #     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# # ============ Auth Helpers ============

# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     return pwd_context.verify(plain_password, hashed_password)

# def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
#     to_encode = data.copy()
#     expire = datetime.now(timezone.utc) + expires_delta
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

# async def get_current_user(authorization: str = Header(None)):
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Not authenticated")
    
#     token = authorization.split(" ")[1]
#     try:
#         payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
#         user_id = payload.get("user_id")
#         if not user_id:
#             raise HTTPException(status_code=401, detail="Invalid token")
        
#         user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
#         if not user:
#             raise HTTPException(status_code=404, detail="User not found")
        
#         return User(**user)
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code=401, detail="Invalid token")




# # ============ Booking Helper Functions ============

# def generate_meeting_link(booking_id: str) -> str:
#     """Generate a unique meeting link for a booking"""
#     token = secrets.token_urlsafe(16)
#     return f"https://meet.novomarket.com/{booking_id}/{token}"

# async def get_available_slots(service_id: str, date: datetime) -> List[dict]:
#     """Get available time slots for a specific date"""
#     day_of_week = date.weekday()  # 0=Monday, 6=Sunday
    
#     # Get weekly availability for this day
#     availability = await db.service_availability.find_one({
#         "service_id": service_id,
#         "day_of_week": day_of_week
#     }, {"_id": 0})
    
#     if not availability:
#         return []
    
#     # Get all bookings for this date
#     start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
#     end_of_day = start_of_day + timedelta(days=1)
    
#     bookings = await db.bookings.find({
#         "service_id": service_id,
#         "start_time": {
#             "$gte": start_of_day.isoformat(),
#             "$lt": end_of_day.isoformat()
#         },
#         "status": {"$in": ["pending", "confirmed"]}
#     }, {"_id": 0}).to_list(100)
    
#     booked_times = set()
#     for booking in bookings:
#         start = datetime.fromisoformat(booking["start_time"])
#         booked_times.add(start.strftime("%H:%M"))
    
#     # Build available slots
#     available = []
#     for slot in availability.get("time_slots", []):
#         if slot["is_available"] and slot["start_time"] not in booked_times:
#             # Convert to full datetime
#             hour, minute = map(int, slot["start_time"].split(":"))
#             slot_datetime = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
#             # Only show future slots
#             if slot_datetime > datetime.now(timezone.utc):
#                 available.append({
#                     "start_time": slot["start_time"],
#                     "end_time": slot["end_time"],
#                     "datetime": slot_datetime.isoformat(),
#                     "is_available": True
#                 })
    
#     return available




# # ============ Routes ============

# @api_router.post("/auth/register", response_model=dict)
# async def register(user_data: UserCreate):
#     existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already registered")
    
#     user = User(
#         email=user_data.email,
#         name=user_data.name,
#         role=user_data.role
#     )
    
#     user_dict = user.model_dump()
#     user_dict['timestamp'] = user_dict.pop('created_at').isoformat()
#     user_dict['password'] = hash_password(user_data.password)
    
#     await db.users.insert_one(user_dict)
    
#     token = create_access_token({"user_id": user.id, "email": user.email})
#     return {"token": token, "user": user.model_dump()}

# @api_router.post("/auth/login", response_model=dict)
# async def login(credentials: UserLogin):
#     user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
#     if not user or not verify_password(credentials.password, user.get('password', '')):
#         raise HTTPException(status_code=401, detail="Invalid credentials")
    
#     user.pop('password', None)
#     if isinstance(user.get('timestamp'), str):
#         user['created_at'] = datetime.fromisoformat(user.pop('timestamp'))
    
#     token = create_access_token({"user_id": user['id'], "email": user['email']})
#     return {"token": token, "user": User(**user).model_dump()}

# @api_router.get("/auth/me", response_model=User)
# async def get_me(current_user: User = Depends(get_current_user)):
#     return current_user

# # Listings
# @api_router.post("/listings", response_model=Listing)
# async def create_listing(listing_data: ListingCreate, current_user: User = Depends(get_current_user)):
#     if current_user.role != "seller":
#         raise HTTPException(status_code=403, detail="Only sellers can create listings")
    
#     listing = Listing(
#         seller_id=current_user.id,
#         seller_name=current_user.name,
#         **listing_data.model_dump()
#     )
    
#     listing_dict = listing.model_dump()
#     listing_dict['timestamp'] = listing_dict.pop('created_at').isoformat()
    
#     await db.listings.insert_one(listing_dict)
#     return listing

# @api_router.get("/listings", response_model=List[Listing])
# async def get_listings(category: Optional[str] = None, search: Optional[str] = None, limit: int = 50):
#     query = {}
#     if category:
#         query['category'] = category
#     if search:
#         query['$or'] = [
#             {'title': {'$regex': search, '$options': 'i'}},
#             {'description': {'$regex': search, '$options': 'i'}}
#         ]
    
#     listings = await db.listings.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
#     for p in listings:
#         if isinstance(p.get('timestamp'), str):
#             p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
    
#     return [Listing(**p) for p in listings]

# @api_router.get("/listings/{listing_id}", response_model=Listing)
# async def get_listing(listing_id: str):
#     listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     if isinstance(listing.get('timestamp'), str):
#         listing['created_at'] = datetime.fromisoformat(listing.pop('timestamp'))
    
#     return Listing(**listing)

# @api_router.put("/listings/{listing_id}", response_model=Listing)
# async def update_listing(listing_id: str, listing_data: ListingUpdate, current_user: User = Depends(get_current_user)):
#     listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     if listing['seller_id'] != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     update_data = {k: v for k, v in listing_data.model_dump().items() if v is not None}
#     await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
#     updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if isinstance(updated.get('timestamp'), str):
#         updated['created_at'] = datetime.fromisoformat(updated.pop('timestamp'))
    
#     return Listing(**updated)

# @api_router.delete("/listings/{listing_id}")
# async def delete_listing(listing_id: str, current_user: User = Depends(get_current_user)):
#     listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     if listing['seller_id'] != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     await db.listings.delete_one({"id": listing_id})
#     return {"message": "Listing deleted"}

# # Reviews
# @api_router.post("/reviews", response_model=Review)
# async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
#     listing = await db.listings.find_one({"id": review_data.listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     review = Review(
#         user_id=current_user.id,
#         user_name=current_user.name,
#         **review_data.model_dump()
#     )
    
#     review_dict = review.model_dump()
#     review_dict['timestamp'] = review_dict.pop('created_at').isoformat()
    
#     await db.reviews.insert_one(review_dict)
    
#     reviews = await db.reviews.find({"listing_id": review_data.listing_id}, {"_id": 0}).to_list(1000)
#     avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
#     await db.listings.update_one(
#         {"id": review_data.listing_id},
#         {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
#     )
    
#     return review

# @api_router.get("/reviews/{listing_id}", response_model=List[Review])
# async def get_reviews(listing_id: str):
#     reviews = await db.reviews.find({"listing_id": listing_id}, {"_id": 0}).to_list(1000)
    
#     for r in reviews:
#         if isinstance(r.get('timestamp'), str):
#             r['created_at'] = datetime.fromisoformat(r.pop('timestamp'))
    
#     return [Review(**r) for r in reviews]

# # Orders
# @api_router.post("/orders", response_model=Order)
# async def create_order(listing_id: str, quantity: int, current_user: User = Depends(get_current_user)):
#     listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
#     if not listing:
#         raise HTTPException(status_code=404, detail="Listing not found")
    
#     if listing.get('type') == "product" and listing.get('stock', 0) < quantity:
#         raise HTTPException(status_code=400, detail="Insufficient stock")
    
#     order = Order(
#         buyer_id=current_user.id,
#         buyer_name=current_user.name,
#         seller_id=listing['seller_id'],
#         listing_id=listing_id,
#         listing_title=listing['title'],
#         quantity=quantity,
#         total_amount=listing['price'] * quantity
#     )
    
#     order_dict = order.model_dump()
#     order_dict['timestamp'] = order_dict.pop('created_at').isoformat()
    
#     await db.orders.insert_one(order_dict)
#     return order

# @api_router.get("/orders", response_model=List[Order])
# async def get_orders(current_user: User = Depends(get_current_user)):
#     query = {"buyer_id": current_user.id} if current_user.role == "buyer" else {"seller_id": current_user.id}
#     orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
#     for o in orders:
#         if isinstance(o.get('timestamp'), str):
#             o['created_at'] = datetime.fromisoformat(o.pop('timestamp'))
    
#     return [Order(**o) for o in orders]


# # ============ BOOKING ROUTES ============

# @api_router.post("/bookings/availability")
# async def set_service_availability(
#     availability_data: AvailabilityCreate,
#     current_user: User = Depends(get_current_user)
# ):
#     """Set weekly availability for a service"""
#     service = await db.listings.find_one(
#         {"id": availability_data.service_id, "seller_id": current_user.id},
#         {"_id": 0}
#     )
#     if not service:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     if not 0 <= availability_data.day_of_week <= 6:
#         raise HTTPException(status_code=400, detail="day_of_week must be 0-6")
    
#     existing = await db.service_availability.find_one({
#         "service_id": availability_data.service_id,
#         "day_of_week": availability_data.day_of_week
#     }, {"_id": 0})
    
#     time_slots_dict = [slot.model_dump() for slot in availability_data.time_slots]
    
#     if existing:
#         await db.service_availability.update_one(
#             {"id": existing["id"]},
#             {"$set": {"time_slots": time_slots_dict}}
#         )
#         result = {**existing, "time_slots": time_slots_dict}
#     else:
#         availability_dict = {
#             "id": str(uuid.uuid4()),
#             "service_id": availability_data.service_id,
#             "provider_id": current_user.id,
#             "day_of_week": availability_data.day_of_week,
#             "time_slots": time_slots_dict,
#             "timestamp": datetime.now(timezone.utc).isoformat()
#         }
#         await db.service_availability.insert_one(availability_dict)
#         result = availability_dict
    
#     return {"message": "Availability set successfully", "availability": result}

# @api_router.get("/bookings/availability/{service_id}")
# async def get_service_availability(service_id: str):
#     """Get weekly availability for a service"""
#     availability = await db.service_availability.find(
#         {"service_id": service_id},
#         {"_id": 0}
#     ).to_list(7)
    
#     return {"availability": availability}

# @api_router.get("/bookings/available-slots/{service_id}")
# async def get_service_available_slots(service_id: str, date: str):
#     """Get available time slots for a specific date"""
#     try:
#         booking_date = datetime.strptime(date, "%Y-%m-%d")
#         booking_date = booking_date.replace(tzinfo=timezone.utc)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
#     slots = await get_available_slots(service_id, booking_date)
#     return {"date": date, "slots": slots}

# @api_router.post("/bookings/create")
# async def create_new_booking(
#     booking_data: BookingCreate,
#     current_user: User = Depends(get_current_user)
# ):
#     """Create a new booking"""
#     if current_user.role != "buyer":
#         raise HTTPException(status_code=403, detail="Only buyers can create bookings")
    
#     service = await db.listings.find_one({"id": booking_data.service_id}, {"_id": 0})
#     if not service:
#         raise HTTPException(status_code=404, detail="Service not found")
    
#     if service.get("type") != "service":
#         raise HTTPException(status_code=400, detail="Can only book services, not products")
    
#     start_time = booking_data.start_time
#     end_time = start_time + timedelta(minutes=booking_data.duration_minutes)
    
#     conflicts = await db.bookings.find({
#         "service_id": booking_data.service_id,
#         "start_time": start_time.isoformat(),
#         "status": {"$in": ["pending", "confirmed"]}
#     }, {"_id": 0}).to_list(1)
    
#     if conflicts:
#         raise HTTPException(status_code=400, detail="This time slot is already booked")
    
#     booking_id = str(uuid.uuid4())
#     booking_dict = {
#         "id": booking_id,
#         "service_id": booking_data.service_id,
#         "service_title": service["title"],
#         "provider_id": service["seller_id"],
#         "provider_name": service["seller_name"],
#         "client_id": current_user.id,
#         "client_name": current_user.name,
#         "start_time": start_time.isoformat(),
#         "end_time": end_time.isoformat(),
#         "duration_minutes": booking_data.duration_minutes,
#         "price": service["price"],
#         "status": "confirmed",
#         "notes": booking_data.notes,
#         "timestamp": datetime.now(timezone.utc).isoformat()
#     }
    
#     meeting_link = generate_meeting_link(booking_id)
#     booking_dict["meeting_link"] = meeting_link
    
#     await db.bookings.insert_one(booking_dict)
    
#     return {
#         "message": "Booking created successfully",
#         "booking": booking_dict
#     }

# @api_router.get("/bookings/my-bookings")
# async def get_my_bookings(
#     status: Optional[str] = None,
#     current_user: User = Depends(get_current_user)
# ):
#     """Get user's bookings"""
#     query = {}
#     if current_user.role == "buyer":
#         query["client_id"] = current_user.id
#     else:
#         query["provider_id"] = current_user.id
    
#     if status:
#         query["status"] = status
    
#     bookings = await db.bookings.find(query, {"_id": 0}).sort("start_time", -1).to_list(100)
    
#     for booking in bookings:
#         if "timestamp" in booking:
#             booking["created_at"] = booking.pop("timestamp")
    
#     return {"bookings": bookings}

# @api_router.post("/bookings/{booking_id}/cancel")
# async def cancel_user_booking(
#     booking_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """Cancel a booking"""
#     booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    
#     if not booking:
#         raise HTTPException(status_code=404, detail="Booking not found")
    
#     if booking["client_id"] != current_user.id and booking["provider_id"] != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     await db.bookings.update_one(
#         {"id": booking_id},
#         {"$set": {"status": "cancelled"}}
#     )
    
#     return {"message": "Booking cancelled successfully"}

# @api_router.post("/bookings/{booking_id}/complete")
# async def complete_booking(
#     booking_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """Mark as completed"""
#     booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    
#     if not booking:
#         raise HTTPException(status_code=404, detail="Booking not found")
    
#     if booking["provider_id"] != current_user.id:
#         raise HTTPException(status_code=403, detail="Only provider can complete")
    
#     await db.bookings.update_one(
#         {"id": booking_id},
#         {"$set": {"status": "completed"}}
#     )
    
#     return {"message": "Booking completed"} 




# # Messages & Chat
# @api_router.get("/users", response_model=List[User])
# async def get_users(current_user: User = Depends(get_current_user)):
#     users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
#     filtered_users = [User(**u) for u in users if u["id"] != current_user.id]
#     return filtered_users

# @api_router.get("/messages/{other_user_id}", response_model=List[Message])
# async def get_messages(other_user_id: str, current_user: User = Depends(get_current_user)):
#     messages = await db.messages.find(
#         {"$or": [
#             {"sender_id": current_user.id, "receiver_id": other_user_id},
#             {"sender_id": other_user_id, "receiver_id": current_user.id}
#         ]},
#         {"_id": 0}
#     ).to_list(10000)
    
#     await db.messages.update_many(
#         {"sender_id": other_user_id, "receiver_id": current_user.id},
#         {"$set": {"read": True}}
#     )
    
#     for m in messages:
#         if isinstance(m.get('timestamp'), str):
#             m['created_at'] = datetime.fromisoformat(m.pop('timestamp'))
    
#     return sorted([Message(**m) for m in messages], key=lambda x: x.created_at)

# @api_router.post("/upload")
# async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
#     try:
#         file.file.seek(0, 2)
#         file_size = file.file.tell()
#         file.file.seek(0)
        
#         if file_size > 10 * 1024 * 1024:
#             raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
#         file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
#         unique_filename = f"{uuid.uuid4()}.{file_extension}"
#         file_path = UPLOAD_DIR / unique_filename
        
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
        
#         file_url = f"http://localhost:8000/uploads/{unique_filename}"
#         return {"file_url": file_url, "file_name": file.filename}
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# # Wishlist
# @api_router.post("/wishlist/{listing_id}")
# async def add_to_wishlist(listing_id: str, current_user: User = Depends(get_current_user)):
#     existing = await db.wishlist.find_one({"user_id": current_user.id, "listing_id": listing_id}, {"_id": 0})
#     if existing:
#         return {"message": "Already in wishlist"}
    
#     wishlist = Wishlist(user_id=current_user.id, listing_id=listing_id)
#     wishlist_dict = wishlist.model_dump()
#     wishlist_dict['timestamp'] = wishlist_dict.pop('created_at').isoformat()
    
#     await db.wishlist.insert_one(wishlist_dict)
#     return {"message": "Added to wishlist"}

# @api_router.delete("/wishlist/{listing_id}")
# async def remove_from_wishlist(listing_id: str, current_user: User = Depends(get_current_user)):
#     await db.wishlist.delete_one({"user_id": current_user.id, "listing_id": listing_id})
#     return {"message": "Removed from wishlist"}

# @api_router.get("/wishlist", response_model=List[Listing])
# async def get_wishlist(current_user: User = Depends(get_current_user)):
#     wishlist_items = await db.wishlist.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
#     listing_ids = [item['listing_id'] for item in wishlist_items]
    
#     listings = await db.listings.find({"id": {"$in": listing_ids}}, {"_id": 0}).to_list(1000)
    
#     for p in listings:
#         if isinstance(p.get('timestamp'), str):
#             p['created_at'] = datetime.fromisoformat(p.pop('timestamp'))
    
#     return [Listing(**p) for p in listings]

# # # Payments

# # class CheckoutSessionResponse(BaseModel):
# #     session_id: str
# #     url: str

# @api_router.post("/checkout/session", response_model=CheckoutSessionResponse)
# async def create_checkout_session(order_id: str, request: Request, current_user: User = Depends(get_current_user)):
#     order = await db.orders.find_one({"id": order_id}, {"_id": 0})
#     if not order:
#         raise HTTPException(status_code=404, detail="Order not found")
    
#     if order['buyer_id'] != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized")
    
#     host_url = str(request.base_url)
#     success_url = f"{host_url}payment-success?session_id={{CHECKOUT_SESSION_ID}}"
#     cancel_url = f"{host_url}payment-cancel"

#     try:
#         checkout_session = stripe.checkout.Session.create(
#             line_items=[{
#                 'price_data': {
#                     'currency': 'usd',
#                     'product_data': {'name': order['listing_title']},
#                     'unit_amount': int(order['total_amount'] * 100),
#                 },
#                 'quantity': order['quantity'],
#             }],
#             mode='payment',
#             success_url=success_url,
#             cancel_url=cancel_url,
#             metadata={"order_id": order_id, "buyer_id": current_user.id}
#         )

#         transaction = PaymentTransaction(
#             session_id=checkout_session.id,
#             order_id=order_id,
#             buyer_id=current_user.id,
#             amount=float(order['total_amount']),
#             currency="usd",
#             payment_status="pending",
#             metadata={"order_id": order_id}
#         )
        
#         transaction_dict = transaction.model_dump()
#         transaction_dict['timestamp'] = transaction_dict.pop('created_at').isoformat()
        
#         await db.payment_transactions.insert_one(transaction_dict)
#         await db.orders.update_one({"id": order_id}, {"$set": {"session_id": checkout_session.id}})
        
#         return CheckoutSessionResponse(session_id=checkout_session.id, url=checkout_session.url)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # class CheckoutStatusResponse(BaseModel):
# #     payment_status: str

# @api_router.get("/checkout/status/{session_id}", response_model=CheckoutStatusResponse)
# async def get_checkout_status(session_id: str, current_user: User = Depends(get_current_user)):
#     try:
#         session = stripe.checkout.Session.retrieve(session_id)
#         payment_status = session.payment_status

#         if payment_status == "paid":
#             transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
#             if transaction and transaction['payment_status'] != "paid":
#                 await db.payment_transactions.update_one(
#                     {"session_id": session_id},
#                     {"$set": {"payment_status": "paid"}}
#                 )
#                 await db.orders.update_one(
#                     {"id": transaction['order_id']},
#                     {"$set": {"payment_status": "paid", "status": "confirmed"}}
#                 )
                
#                 order = await db.orders.find_one({"id": transaction['order_id']}, {"_id": 0})
#                 if order:
#                     await db.listings.update_one(
#                         {"id": order['listing_id']},
#                         {"$inc": {"stock": -order['quantity']}}
#                     )
        
#         return CheckoutStatusResponse(payment_status=payment_status)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @api_router.post("/webhook/stripe")
# async def stripe_webhook(request: Request):
#     payload = await request.body()
#     sig_header = request.headers.get('stripe-signature')

#     try:
#         event = stripe.Webhook.construct_event(
#             payload=payload, sig_header=sig_header, secret=STRIPE_WEBHOOK_SECRET
#         )
#     except:
#         raise HTTPException(status_code=400, detail="Invalid signature")

#     if event['type'] == 'checkout.session.completed':
#         session = event['data']['object']
#         session_id = session['id']
#         payment_status = session['payment_status']

#         if payment_status == "paid":
#             transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
#             if transaction and transaction['payment_status'] != "paid":
#                 await db.payment_transactions.update_one(
#                     {"session_id": session_id},
#                     {"$set": {"payment_status": "paid"}}
#                 )
#                 await db.orders.update_one(
#                     {"id": transaction['order_id']},
#                     {"$set": {"payment_status": "paid", "status": "confirmed"}}
#                 )

#     return {"status": "success"}

# # WebSocket for Chat
# @app.websocket("/ws/chat/{user_id}")
# async def chat_endpoint(websocket: WebSocket, user_id: str):
#     await connection_manager.connect(websocket, user_id)
    
#     try:
#         while True:
#             data = await websocket.receive_json()
#             receiver_id = data.get("receiver_id")
#             message_text = data.get("message", "")
#             file_url = data.get("file_url")
#             file_type = data.get("file_type")
#             file_name = data.get("file_name")

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
            
#             await db.messages.insert_one(message_doc.copy())

#             ws_message = {"type": "chat", "data": message_doc}
            
#             await connection_manager.send_personal_message(receiver_id, ws_message)
#             await websocket.send_json(ws_message)

#     except WebSocketDisconnect:
#         await connection_manager.disconnect(websocket, user_id)
#     except Exception as e:
#         print(f"WebSocket error: {e}")
#         await connection_manager.disconnect(websocket, user_id)

# # Include router and mount static files
# app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
# app.include_router(api_router)

# app.add_middleware(
#     CORSMiddleware,
#     allow_credentials=True,
#     allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# @app.on_event("shutdown")
# async def shutdown_db_client():
#     client.close()