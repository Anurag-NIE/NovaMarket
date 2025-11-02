# backend/routes/notification_routes.py - COMPLETE FILE
"""
Notification Routes for NovoMarket
Handles in-app notifications API
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from database import get_db
from utils.auth_utils import get_current_user
from models import User
from services.notification_service import (
    create_notification,
    send_booking_notifications,
    send_message_notification,
    send_cancellation_notification
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get user notifications"""
    db = get_db()
    query = {"user_id": current_user.id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Convert timestamps
    for n in notifications:
        if isinstance(n.get("timestamp"), str):
            n["created_at"] = n.pop("timestamp")
    
    return {"notifications": notifications}


@router.post("/{notif_id}/mark-read")
async def mark_notification_read(
    notif_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    db = get_db()
    result = await db.notifications.update_one(
        {"id": notif_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Marked as read"}


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    db = get_db()
    result = await db.notifications.update_many(
        {"user_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {
        "message": f"Marked {result.modified_count} notifications as read",
        "count": result.modified_count
    }


@router.get("/unread-count")
async def get_unread_notification_count(
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    db = get_db()
    count = await db.notifications.count_documents({
        "user_id": current_user.id,
        "read": False
    })
    return {"unread_count": count}


@router.post("/test")
async def create_test_notification(
    current_user: User = Depends(get_current_user)
):
    """Create a test notification (for testing only)"""
    notification = await create_notification(
        user_id=current_user.id,
        notification_type="booking_confirmed",
        title="Test Notification ✅",
        message="This is a test notification to verify the system is working!",
        link="/buyer-dashboard",
        data={"test": True}
    )
    
    return {
        "message": "Test notification created",
        "notification": notification
    }


print("✅ Notification routes loaded successfully!")