# # backend/services/booking_service.py - NEW FILE
# from database import db, redis_client
# from models import Booking, ServiceAvailability, TimeSlot
# from datetime import datetime, timedelta, timezone
# from typing import List, Optional
# import uuid

# # ============ SLOT LOCKING (Redis) ============

# def lock_slot(service_id: str, start_time: datetime, user_id: str, timeout: int = 300) -> bool:
#     """Lock a time slot for 5 minutes (300 seconds) to prevent double booking"""
#     slot_key = f"slot_lock:{service_id}:{start_time.isoformat()}"
#     try:
#         # NX = only set if not exists, EX = expiry in seconds
#         locked = redis_client.set(slot_key, user_id, nx=True, ex=timeout)
#         return bool(locked)
#     except Exception as e:
#         print(f"Redis lock error: {e}")
#         return False

# def unlock_slot(service_id: str, start_time: datetime):
#     """Manually unlock a slot"""
#     slot_key = f"slot_lock:{service_id}:{start_time.isoformat()}"
#     try:
#         redis_client.delete(slot_key)
#     except Exception as e:
#         print(f"Redis unlock error: {e}")

# def is_slot_locked(service_id: str, start_time: datetime) -> bool:
#     """Check if slot is currently locked"""
#     slot_key = f"slot_lock:{service_id}:{start_time.isoformat()}"
#     try:
#         return redis_client.exists(slot_key) > 0
#     except Exception as e:
#         print(f"Redis check error: {e}")
#         return False

# # ============ AVAILABILITY MANAGEMENT ============

# async def set_availability(
#     service_id: str,
#     provider_id: str,
#     day_of_week: int,
#     time_slots: List[TimeSlot]
# ) -> ServiceAvailability:
#     """Set provider's weekly availability for a service"""
    
#     availability = ServiceAvailability(
#         service_id=service_id,
#         provider_id=provider_id,
#         day_of_week=day_of_week,
#         time_slots=time_slots
#     )
    
#     avail_dict = availability.model_dump()
#     avail_dict['timestamp'] = avail_dict.pop('created_at').isoformat()
    
#     # Upsert (update or insert)
#     await db.availability.update_one(
#         {
#             "service_id": service_id,
#             "provider_id": provider_id,
#             "day_of_week": day_of_week
#         },
#         {"$set": avail_dict},
#         upsert=True
#     )
    
#     return availability

# async def get_availability(service_id: str) -> List[ServiceAvailability]:
#     """Get provider's weekly availability"""
#     availability = await db.availability.find(
#         {"service_id": service_id},
#         {"_id": 0}
#     ).to_list(7)  # Max 7 days
    
#     result = []
#     for avail in availability:
#         if isinstance(avail.get('timestamp'), str):
#             avail['created_at'] = datetime.fromisoformat(avail.pop('timestamp'))
#         result.append(ServiceAvailability(**avail))
    
#     return result

# # ============ AVAILABLE SLOTS ============

# async def get_available_slots(service_id: str, date: datetime) -> List[dict]:
#     """Get all available time slots for a specific date"""
    
#     day_of_week = date.weekday()
    
#     # Get provider's availability for this day
#     availability = await db.availability.find_one({
#         "service_id": service_id,
#         "day_of_week": day_of_week
#     }, {"_id": 0})
    
#     if not availability:
#         return []
    
#     # Get existing bookings for this date
#     start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
#     end_of_day = start_of_day + timedelta(days=1)
    
#     bookings = await db.bookings.find({
#         "service_id": service_id,
#         "start_time": {
#             "$gte": start_of_day.isoformat(),
#             "$lt": end_of_day.isoformat()
#         },
#         "status": {"$ne": "cancelled"}
#     }, {"_id": 0}).to_list(100)
    
#     # Generate available slots (30-minute intervals)
#     available_slots = []
    
#     for time_range in availability['time_slots']:
#         start_hour, start_min = map(int, time_range['start'].split(':'))
#         end_hour, end_min = map(int, time_range['end'].split(':'))
        
#         current = date.replace(hour=start_hour, minute=start_min, second=0, microsecond=0)
#         end = date.replace(hour=end_hour, minute=end_min, second=0, microsecond=0)
        
#         while current < end:
#             slot_end = current + timedelta(minutes=30)
            
#             # Check if slot is booked
#             is_booked = any(
#                 datetime.fromisoformat(b['start_time']) <= current < datetime.fromisoformat(b['end_time'])
#                 for b in bookings
#             )
            
#             # Check if slot is locked
#             is_locked = is_slot_locked(service_id, current)
            
#             # Check if slot is in the past
#             is_past = current < datetime.now(timezone.utc)
            
#             available_slots.append({
#                 "start": current.isoformat(),
#                 "end": slot_end.isoformat(),
#                 "available": not is_booked and not is_locked and not is_past,
#                 "locked": is_locked,
#                 "booked": is_booked
#             })
            
#             current = slot_end
    
#     return available_slots

# # ============ BOOKING CREATION ============

# async def create_booking(
#     service_id: str,
#     provider_id: str,
#     provider_name: str,
#     client_id: str,
#     client_name: str,
#     start_time: datetime,
#     duration_minutes: int,
#     price: float,
#     notes: Optional[str] = None
# ) -> Booking:
#     """Create a new booking"""
    
#     end_time = start_time + timedelta(minutes=duration_minutes)
    
#     # Check if slot is locked
#     if is_slot_locked(service_id, start_time):
#         raise ValueError("Slot is currently being booked by someone else")
    
#     # Check for existing bookings at this time
#     existing = await db.bookings.find_one({
#         "service_id": service_id,
#         "start_time": {"$lte": end_time.isoformat()},
#         "end_time": {"$gte": start_time.isoformat()},
#         "status": {"$ne": "cancelled"}
#     }, {"_id": 0})
    
#     if existing:
#         raise ValueError("Time slot is already booked")
    
#     # Lock the slot
#     if not lock_slot(service_id, start_time, client_id):
#         raise ValueError("Failed to lock time slot")
    
#     try:
#         booking = Booking(
#             service_id=service_id,
#             provider_id=provider_id,
#             provider_name=provider_name,
#             client_id=client_id,
#             client_name=client_name,
#             start_time=start_time,
#             end_time=end_time,
#             duration_minutes=duration_minutes,
#             price=price,
#             notes=notes,
#             status="confirmed"
#         )
        
#         booking_dict = booking.model_dump()
#         booking_dict['timestamp'] = booking_dict.pop('created_at').isoformat()
#         booking_dict['start_time'] = booking.start_time.isoformat()
#         booking_dict['end_time'] = booking.end_time.isoformat()
        
#         await db.bookings.insert_one(booking_dict)
        
#         return booking
#     except Exception as e:
#         # Unlock on error
#         unlock_slot(service_id, start_time)
#         raise e

# # ============ BOOKING MANAGEMENT ============

# async def get_user_bookings(user_id: str, role: str, status: Optional[str] = None) -> List[Booking]:
#     """Get bookings for a user (as client or provider)"""
    
#     query = {}
#     if role == "buyer":
#         query["client_id"] = user_id
#     else:
#         query["provider_id"] = user_id
    
#     if status:
#         query["status"] = status
    
#     bookings = await db.bookings.find(query, {"_id": 0}).to_list(1000)
    
#     result = []
#     for b in bookings:
#         if isinstance(b.get('timestamp'), str):
#             b['created_at'] = datetime.fromisoformat(b.pop('timestamp'))
#         if isinstance(b.get('start_time'), str):
#             b['start_time'] = datetime.fromisoformat(b['start_time'])
#         if isinstance(b.get('end_time'), str):
#             b['end_time'] = datetime.fromisoformat(b['end_time'])
#         result.append(Booking(**b))
    
#     return sorted(result, key=lambda x: x.start_time, reverse=True)

# async def cancel_booking(booking_id: str, user_id: str) -> bool:
#     """Cancel a booking"""
    
#     booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
#     if not booking:
#         raise ValueError("Booking not found")
    
#     # Only client or provider can cancel
#     if booking['client_id'] != user_id and booking['provider_id'] != user_id:
#         raise ValueError("Not authorized to cancel this booking")
    
#     # Check cancellation policy (24 hours before)
#     start_time = datetime.fromisoformat(booking['start_time'])
#     if start_time - datetime.now(timezone.utc) < timedelta(hours=24):
#         raise ValueError("Cannot cancel within 24 hours of booking")
    
#     await db.bookings.update_one(
#         {"id": booking_id},
#         {"$set": {"status": "cancelled"}}
#     )
    
#     return True

# async def generate_meeting_link(booking_id: str) -> str:
#     """Generate Jitsi meeting link for booking"""
    
#     room_name = f"service_{booking_id}_{uuid.uuid4().hex[:8]}"
#     meeting_link = f"https://meet.jit.si/{room_name}"
    
#     await db.bookings.update_one(
#         {"id": booking_id},
#         {"$set": {"meeting_link": meeting_link}}
#     )
    
#     return meeting_link

















# backend/services/booking_service.py - ENHANCED & COMPLETE
"""
Complete Booking Service with Advanced Features
- Slot locking with Redis
- Availability management
- Smart slot generation
- Booking lifecycle management
- Meeting link generation
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
import uuid
import secrets

from database import get_db, redis_client
from models import Booking, ServiceAvailability, TimeSlot

# ============ SLOT LOCKING (Redis) ============

def lock_slot(service_id: str, start_time: datetime, user_id: str, timeout: int = 300) -> bool:
    """
    Lock a time slot for 5 minutes to prevent double booking
    
    Args:
        service_id: Service ID
        start_time: Slot start time
        user_id: User attempting to book
        timeout: Lock timeout in seconds (default: 300 = 5 minutes)
    
    Returns:
        True if lock acquired, False otherwise
    """
    if not redis_client:
        print("⚠️  Redis not available, skipping lock")
        return True
    
    slot_key = f"slot_lock:{service_id}:{start_time.isoformat()}"
    try:
        # NX = only set if not exists, EX = expiry in seconds
        locked = redis_client.set(slot_key, user_id, nx=True, ex=timeout)
        if locked:
            print(f"🔒 Slot locked: {service_id} at {start_time.isoformat()} by {user_id}")
        return bool(locked)
    except Exception as e:
        print(f"❌ Redis lock error: {e}")
        return True  # Allow booking on error


def unlock_slot(service_id: str, start_time: datetime):
    """Manually unlock a time slot"""
    if not redis_client:
        return
    
    slot_key = f"slot_lock:{service_id}:{start_time.isoformat()}"
    try:
        redis_client.delete(slot_key)
        print(f"🔓 Slot unlocked: {service_id} at {start_time.isoformat()}")
    except Exception as e:
        print(f"❌ Redis unlock error: {e}")


def is_slot_locked(service_id: str, start_time: datetime) -> bool:
    """Check if a slot is currently locked"""
    if not redis_client:
        return False
    
    slot_key = f"slot_lock:{service_id}:{start_time.isoformat()}"
    try:
        return redis_client.exists(slot_key) > 0
    except Exception as e:
        print(f"❌ Redis check error: {e}")
        return False


def get_lock_info(service_id: str, start_time: datetime) -> Optional[Dict[str, Any]]:
    """Get information about who locked the slot"""
    if not redis_client:
        return None
    
    slot_key = f"slot_lock:{service_id}:{start_time.isoformat()}"
    try:
        user_id = redis_client.get(slot_key)
        ttl = redis_client.ttl(slot_key)
        
        if user_id:
            return {
                "locked": True,
                "user_id": user_id.decode() if isinstance(user_id, bytes) else user_id,
                "expires_in": ttl
            }
        return None
    except Exception as e:
        print(f"❌ Redis lock info error: {e}")
        return None


# ============ AVAILABILITY MANAGEMENT ============

async def set_availability(
    service_id: str,
    provider_id: str,
    day_of_week: int,
    time_slots: List[TimeSlot]
) -> ServiceAvailability:
    """
    Set provider's weekly availability for a service
    
    Args:
        service_id: Service ID
        provider_id: Provider user ID
        day_of_week: 0=Monday, 6=Sunday
        time_slots: List of time slot objects
    
    Returns:
        ServiceAvailability object
    """
    db = get_db()
    
    # Validate day_of_week
    if not 0 <= day_of_week <= 6:
        raise ValueError("day_of_week must be between 0 (Monday) and 6 (Sunday)")
    
    # Verify provider owns the service
    service = await db.listings.find_one(
        {"id": service_id, "seller_id": provider_id},
        {"_id": 0}
    )
    if not service:
        raise ValueError("Service not found or you don't have permission")
    
    availability = ServiceAvailability(
        service_id=service_id,
        provider_id=provider_id,
        day_of_week=day_of_week,
        time_slots=time_slots
    )
    
    avail_dict = availability.model_dump()
    avail_dict['timestamp'] = avail_dict.pop('created_at').isoformat()
    
    # Upsert (update or insert)
    await db.availability.update_one(
        {
            "service_id": service_id,
            "provider_id": provider_id,
            "day_of_week": day_of_week
        },
        {"$set": avail_dict},
        upsert=True
    )
    
    print(f"✅ Availability set for service {service_id}, day {day_of_week}")
    return availability


async def get_availability(service_id: str) -> List[ServiceAvailability]:
    """Get provider's complete weekly availability"""
    db = get_db()
    availability = await db.availability.find(
        {"service_id": service_id},
        {"_id": 0}
    ).to_list(7)  # Max 7 days
    
    result = []
    for avail in availability:
        if isinstance(avail.get('timestamp'), str):
            avail['created_at'] = datetime.fromisoformat(avail.pop('timestamp'))
        result.append(ServiceAvailability(**avail))
    
    # Sort by day of week
    result.sort(key=lambda x: x.day_of_week)
    return result


async def delete_availability(service_id: str, provider_id: str, day_of_week: int) -> bool:
    """Delete availability for a specific day"""
    db = get_db()
    result = await db.availability.delete_one({
        "service_id": service_id,
        "provider_id": provider_id,
        "day_of_week": day_of_week
    })
    return result.deleted_count > 0


# ============ AVAILABLE SLOTS GENERATION ============

async def get_available_slots(service_id: str, date: datetime) -> List[dict]:
    """
    Get all available time slots for a specific date
    Generates 30-minute slots based on provider's availability
    
    Args:
        service_id: Service ID
        date: Date to check availability
    
    Returns:
        List of slot dictionaries with availability status
    """
    db = get_db()
    day_of_week = date.weekday()
    
    # Get provider's availability for this day
    availability = await db.availability.find_one({
        "service_id": service_id,
        "day_of_week": day_of_week
    }, {"_id": 0})
    
    if not availability:
        print(f"ℹ️  No availability configured for day {day_of_week}")
        return []
    
    # Get existing bookings for this date
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    bookings = await db.bookings.find({
        "service_id": service_id,
        "start_time": {
            "$gte": start_of_day.isoformat(),
            "$lt": end_of_day.isoformat()
        },
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(100)
    
    print(f"📅 Found {len(bookings)} existing bookings for {date.date()}")
    
    # Generate available slots (30-minute intervals)
    available_slots = []
    now_utc = datetime.now(timezone.utc)
    
    for time_range in availability.get('time_slots', []):
        if not time_range.get('is_available', True):
            continue
        
        start_hour, start_min = map(int, time_range['start_time'].split(':'))
        end_hour, end_min = map(int, time_range['end_time'].split(':'))
        
        current = date.replace(hour=start_hour, minute=start_min, second=0, microsecond=0)
        end = date.replace(hour=end_hour, minute=end_min, second=0, microsecond=0)
        
        while current < end:
            slot_end = current + timedelta(minutes=30)
            
            # Check if slot is booked
            is_booked = any(
                datetime.fromisoformat(b['start_time']) <= current < datetime.fromisoformat(b['end_time'])
                for b in bookings
            )
            
            # Check if slot is locked
            is_locked = is_slot_locked(service_id, current)
            
            # Check if slot is in the past
            is_past = current < now_utc
            
            slot_info = {
                "start": current.isoformat(),
                "end": slot_end.isoformat(),
                "available": not is_booked and not is_locked and not is_past,
                "locked": is_locked,
                "booked": is_booked,
                "is_past": is_past
            }
            
            # Add lock info if locked
            if is_locked:
                lock_info = get_lock_info(service_id, current)
                if lock_info:
                    slot_info["lock_expires_in"] = lock_info["expires_in"]
            
            available_slots.append(slot_info)
            current = slot_end
    
    return available_slots


# ============ BOOKING CREATION ============

async def create_booking(
    service_id: str,
    provider_id: str,
    provider_name: str,
    client_id: str,
    client_name: str,
    start_time: datetime,
    duration_minutes: int,
    price: float,
    notes: Optional[str] = None,
    service_title: Optional[str] = None
) -> Booking:
    """
    Create a new booking with validation and slot locking
    
    Args:
        service_id: Service ID
        provider_id: Provider user ID
        provider_name: Provider name
        client_id: Client user ID
        client_name: Client name
        start_time: Booking start time
        duration_minutes: Duration in minutes
        price: Booking price
        notes: Optional booking notes
        service_title: Optional service title
    
    Returns:
        Created Booking object
    
    Raises:
        ValueError: If booking validation fails
    """
    db = get_db()
    end_time = start_time + timedelta(minutes=duration_minutes)
    
    # 1. Check if slot is locked by someone else
    lock_info = get_lock_info(service_id, start_time)
    if lock_info and lock_info.get("user_id") != client_id:
        raise ValueError("This slot is currently being booked by someone else. Please try another slot.")
    
    # 2. Check for existing bookings at this time
    existing = await db.bookings.find_one({
        "service_id": service_id,
        "start_time": {"$lte": end_time.isoformat()},
        "end_time": {"$gte": start_time.isoformat()},
        "status": {"$ne": "cancelled"}
    }, {"_id": 0})
    
    if existing:
        raise ValueError("This time slot is already booked")
    
    # 3. Lock the slot (if not already locked by this user)
    if not lock_info:
        if not lock_slot(service_id, start_time, client_id):
            raise ValueError("Failed to acquire slot lock. Please try again.")
    
    try:
        # 4. Get service title if not provided
        if not service_title:
            service = await db.listings.find_one({"id": service_id}, {"_id": 0, "title": 1})
            service_title = service.get("title", "Service") if service else "Service"
        
        # 5. Create booking
        booking = Booking(
            service_id=service_id,
            service_title=service_title,
            provider_id=provider_id,
            provider_name=provider_name,
            client_id=client_id,
            client_name=client_name,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            price=price,
            notes=notes,
            status="confirmed",
            meeting_link=generate_meeting_link(str(uuid.uuid4()))
        )
        
        booking_dict = booking.model_dump()
        booking_dict['timestamp'] = booking_dict.pop('created_at').isoformat()
        booking_dict['start_time'] = booking.start_time.isoformat()
        booking_dict['end_time'] = booking.end_time.isoformat()
        
        # 6. Save to database
        await db.bookings.insert_one(booking_dict)
        
        print(f"✅ Booking created: {booking.id}")
        
        # 7. Unlock the slot (booking is confirmed)
        unlock_slot(service_id, start_time)
        
        return booking
        
    except Exception as e:
        # Unlock on error
        unlock_slot(service_id, start_time)
        print(f"❌ Booking creation failed: {e}")
        raise e


# ============ BOOKING MANAGEMENT ============

async def get_user_bookings(
    user_id: str, 
    role: str, 
    status: Optional[str] = None,
    upcoming_only: bool = False
) -> List[Booking]:
    """
    Get bookings for a user (as client or provider)
    
    Args:
        user_id: User ID
        role: User role ('buyer' or 'seller')
        status: Filter by status (optional)
        upcoming_only: Only return future bookings
    
    Returns:
        List of Booking objects
    """
    db = get_db()
    
    query = {}
    if role == "buyer":
        query["client_id"] = user_id
    else:
        query["provider_id"] = user_id
    
    if status:
        query["status"] = status
    
    if upcoming_only:
        now = datetime.now(timezone.utc)
        query["start_time"] = {"$gte": now.isoformat()}
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(1000)
    
    result = []
    for b in bookings:
        if isinstance(b.get('timestamp'), str):
            b['created_at'] = datetime.fromisoformat(b.pop('timestamp'))
        if isinstance(b.get('start_time'), str):
            b['start_time'] = datetime.fromisoformat(b['start_time'])
        if isinstance(b.get('end_time'), str):
            b['end_time'] = datetime.fromisoformat(b['end_time'])
        result.append(Booking(**b))
    
    # Sort by start time (most recent first)
    result.sort(key=lambda x: x.start_time, reverse=True)
    return result


async def get_booking_by_id(booking_id: str) -> Optional[Booking]:
    """Get a specific booking by ID"""
    db = get_db()
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    
    if not booking:
        return None
    
    if isinstance(booking.get('timestamp'), str):
        booking['created_at'] = datetime.fromisoformat(booking.pop('timestamp'))
    if isinstance(booking.get('start_time'), str):
        booking['start_time'] = datetime.fromisoformat(booking['start_time'])
    if isinstance(booking.get('end_time'), str):
        booking['end_time'] = datetime.fromisoformat(booking['end_time'])
    
    return Booking(**booking)


async def cancel_booking(booking_id: str, user_id: str, role: str) -> Dict[str, Any]:
    """
    Cancel a booking with validation
    
    Args:
        booking_id: Booking ID
        user_id: User requesting cancellation
        role: User role
    
    Returns:
        Result dictionary with status
    
    Raises:
        ValueError: If cancellation not allowed
    """
    db = get_db()
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    
    if not booking:
        raise ValueError("Booking not found")
    
    # Check authorization
    if booking['client_id'] != user_id and booking['provider_id'] != user_id:
        raise ValueError("Not authorized to cancel this booking")
    
    # Check if already cancelled
    if booking['status'] == 'cancelled':
        raise ValueError("Booking is already cancelled")
    
    # Check cancellation policy (24 hours before)
    start_time = datetime.fromisoformat(booking['start_time'])
    time_until_booking = start_time - datetime.now(timezone.utc)
    
    if time_until_booking < timedelta(hours=24):
        raise ValueError("Cannot cancel within 24 hours of booking start time")
    
    # Update booking status
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "status": "cancelled",
                "cancelled_by": user_id,
                "cancelled_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    print(f"🚫 Booking cancelled: {booking_id} by {user_id}")
    
    return {
        "success": True,
        "message": "Booking cancelled successfully",
        "booking_id": booking_id,
        "refund_eligible": time_until_booking > timedelta(hours=48)
    }


async def complete_booking(booking_id: str, provider_id: str) -> bool:
    """
    Mark a booking as completed (provider only)
    
    Args:
        booking_id: Booking ID
        provider_id: Provider user ID
    
    Returns:
        True if successful
    
    Raises:
        ValueError: If operation not allowed
    """
    db = get_db()
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    
    if not booking:
        raise ValueError("Booking not found")
    
    if booking['provider_id'] != provider_id:
        raise ValueError("Only the provider can mark a booking as completed")
    
    if booking['status'] == 'completed':
        raise ValueError("Booking is already marked as completed")
    
    if booking['status'] == 'cancelled':
        raise ValueError("Cannot complete a cancelled booking")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    print(f"✅ Booking completed: {booking_id}")
    return True


# ============ MEETING LINK GENERATION ============

def generate_meeting_link(booking_id: str) -> str:
    """
    Generate a unique Jitsi meeting link for a booking
    
    Args:
        booking_id: Booking ID
    
    Returns:
        Meeting link URL
    """
    token = secrets.token_urlsafe(12)
    room_name = f"novomarket_{booking_id}_{token}"
    return f"https://meet.jit.si/{room_name}"


async def update_meeting_link(booking_id: str) -> str:
    """Regenerate meeting link for a booking"""
    db = get_db()
    new_link = generate_meeting_link(booking_id)
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"meeting_link": new_link}}
    )
    
    return new_link


# ============ BOOKING STATISTICS ============

async def get_booking_stats(service_id: str) -> Dict[str, Any]:
    """Get booking statistics for a service"""
    db = get_db()
    
    bookings = await db.bookings.find(
        {"service_id": service_id},
        {"_id": 0}
    ).to_list(10000)
    
    total = len(bookings)
    confirmed = len([b for b in bookings if b['status'] == 'confirmed'])
    completed = len([b for b in bookings if b['status'] == 'completed'])
    cancelled = len([b for b in bookings if b['status'] == 'cancelled'])
    
    total_revenue = sum(b['price'] for b in bookings if b['status'] != 'cancelled')
    
    return {
        "total_bookings": total,
        "confirmed": confirmed,
        "completed": completed,
        "cancelled": cancelled,
        "cancellation_rate": (cancelled / total * 100) if total > 0 else 0,
        "total_revenue": total_revenue,
        "average_booking_value": total_revenue / (total - cancelled) if (total - cancelled) > 0 else 0
    }


print("✅ Enhanced Booking Service loaded successfully!")