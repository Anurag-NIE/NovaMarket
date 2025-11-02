"""
NovoMarket Notification Service
Handles in-app notifications and email notifications
Location: backend/services/notification_service.py
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from utils.auth_utils import get_current_user
from models import User

# Create router for notification endpoints
router = APIRouter()

# ============ HELPER FUNCTIONS ============

async def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None
) -> dict:
    """
    Create an in-app notification
    
    Args:
        user_id: ID of the user to notify
        notification_type: Type of notification (booking_confirmed, new_message, etc.)
        title: Notification title
        message: Notification message
        link: Optional link to redirect when clicked
        data: Optional additional data
    
    Returns:
        Created notification dict
    """
    db = get_db()
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "link": link or "/",
        "data": data or {},
        "read": False,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await db.notifications.insert_one(notification.copy())
        print(f"✅ Notification created for user {user_id}: {title}")
        return notification
    except Exception as e:
        print(f"❌ Failed to create notification: {e}")
        return notification


async def send_booking_notifications(booking: dict) -> None:
    """
    Send notifications for a new booking
    
    Args:
        booking: Booking dictionary with all details
    """
    try:
        # Notification for the client (buyer)
        await create_notification(
            user_id=booking["client_id"],
            notification_type="booking_confirmed",
            title="Booking Confirmed! 🎉",
            message=f"Your booking for '{booking['service_title']}' has been confirmed.",
            link=f"/buyer-dashboard?tab=bookings",
            data={
                "booking_id": booking["id"],
                "service_id": booking["service_id"],
                "start_time": booking["start_time"]
            }
        )
        
        # Notification for the provider (seller)
        await create_notification(
            user_id=booking["provider_id"],
            notification_type="new_booking",
            title="New Booking Received! 💼",
            message=f"{booking['client_name']} booked your service '{booking['service_title']}'.",
            link=f"/seller-dashboard?tab=bookings",
            data={
                "booking_id": booking["id"],
                "service_id": booking["service_id"],
                "client_id": booking["client_id"],
                "start_time": booking["start_time"]
            }
        )
        
        print(f"✅ Booking notifications sent for booking {booking['id']}")
        
    except Exception as e:
        print(f"❌ Failed to send booking notifications: {e}")


async def send_message_notification(sender_name: str, receiver_id: str, message_preview: str) -> None:
    """Send notification for a new message"""
    try:
        await create_notification(
            user_id=receiver_id,
            notification_type="new_message",
            title=f"New message from {sender_name} 💬",
            message=message_preview[:100] + "..." if len(message_preview) > 100 else message_preview,
            link="/messages",
            data={"sender_name": sender_name}
        )
        print(f"✅ Message notification sent to user {receiver_id}")
    except Exception as e:
        print(f"❌ Failed to send message notification: {e}")


async def send_review_notification(listing_id: str, listing_title: str, seller_id: str, rating: int) -> None:
    """Send notification for a new review"""
    try:
        stars = "⭐" * rating
        await create_notification(
            user_id=seller_id,
            notification_type="new_review",
            title="New Review Received! ⭐",
            message=f"Someone rated your listing '{listing_title}' {stars}",
            link=f"/listings/{listing_id}",
            data={
                "listing_id": listing_id,
                "rating": rating
            }
        )
        print(f"✅ Review notification sent to seller {seller_id}")
    except Exception as e:
        print(f"❌ Failed to send review notification: {e}")


async def send_payment_notification(order_id: str, seller_id: str, amount: float, listing_title: str) -> None:
    """Send notification for a successful payment"""
    try:
        await create_notification(
            user_id=seller_id,
            notification_type="payment_received",
            title="Payment Received! 💰",
            message=f"You received ${amount:.2f} for '{listing_title}'",
            link=f"/seller-dashboard?tab=orders",
            data={
                "order_id": order_id,
                "amount": amount
            }
        )
        print(f"✅ Payment notification sent to seller {seller_id}")
    except Exception as e:
        print(f"❌ Failed to send payment notification: {e}")


async def get_unread_count(user_id: str) -> int:
    """Get count of unread notifications for a user"""
    try:
        db = get_db()
        count = await db.notifications.count_documents({
            "user_id": user_id,
            "read": False
        })
        return count
    except Exception as e:
        print(f"❌ Failed to get unread count: {e}")
        return 0


# ============ API ROUTES ============

@router.get("")
async def get_notifications(
    unread_only: bool = False,
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
    ).sort("timestamp", -1).limit(50).to_list(50)
    
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


@router.get("/unread-count")
async def get_unread_notification_count(
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    count = await get_unread_count(current_user.id)
    return {"unread_count": count}


print("✅ Notification service loaded successfully!")



# Add at the end of notification_service.py

async def send_cancellation_notification(booking: dict, cancelled_by_user_id: str):
    """Send notification when booking is cancelled"""
    db = get_db()
    
    # Determine who to notify
    other_user_id = (
        booking["provider_id"] 
        if booking["client_id"] == cancelled_by_user_id 
        else booking["client_id"]
    )
    
    canceller = await db.users.find_one({"id": cancelled_by_user_id}, {"_id": 0})
    canceller_name = canceller["name"] if canceller else "Someone"
    
    await create_notification(
        user_id=other_user_id,
        notification_type="booking_cancelled",
        title="Booking Cancelled 🚫",
        message=f"{canceller_name} cancelled the booking for '{booking['service_title']}'",
        link="/buyer-dashboard" if booking["provider_id"] == other_user_id else "/seller-dashboard",
        data={"booking_id": booking["id"]}
    )
    
    print(f"✅ Cancellation notification sent")




















# # backend/services/notification_service.py - COMPLETE FILE
# from database import db
# from models import Notification, NotificationType
# from datetime import datetime, timezone
# from typing import Optional, Dict, Any
# import smtplib
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart
# import os

# # ============ EMAIL SERVICE ============

# class EmailService:
#     def __init__(self):
#         self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
#         self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
#         self.smtp_user = os.getenv('SMTP_USER')
#         self.smtp_password = os.getenv('SMTP_PASSWORD')
#         self.from_email = os.getenv('FROM_EMAIL', 'noreply@novomarket.com')
    
#     def send_email(self, to_email: str, subject: str, html_body: str):
#         """Send email notification"""
#         if not self.smtp_user or not self.smtp_password:
#             print("⚠️  Email not configured - skipping email send")
#             return False
        
#         try:
#             msg = MIMEMultipart('alternative')
#             msg['Subject'] = subject
#             msg['From'] = self.from_email
#             msg['To'] = to_email
            
#             html_part = MIMEText(html_body, 'html')
#             msg.attach(html_part)
            
#             with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
#                 server.starttls()
#                 server.login(self.smtp_user, self.smtp_password)
#                 server.send_message(msg)
            
#             print(f"✅ Email sent to {to_email}")
#             return True
#         except Exception as e:
#             print(f"❌ Email failed: {e}")
#             return False

# email_service = EmailService()

# # ============ EMAIL TEMPLATES ============

# def get_booking_confirmation_email(booking: Dict, client: Dict, provider: Dict, service_title: str) -> str:
#     """HTML template for booking confirmation"""
#     start_time = datetime.fromisoformat(booking['start_time'])
    
#     return f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ 
#                 font-family: Arial, sans-serif; 
#                 line-height: 1.6; 
#                 color: #333; 
#                 margin: 0; 
#                 padding: 0; 
#             }}
#             .container {{ 
#                 max-width: 600px; 
#                 margin: 0 auto; 
#                 padding: 20px; 
#             }}
#             .header {{ 
#                 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
#                 color: white; 
#                 padding: 30px; 
#                 text-align: center; 
#                 border-radius: 10px 10px 0 0; 
#             }}
#             .content {{ 
#                 background: #f9fafb; 
#                 padding: 30px; 
#                 border-radius: 0 0 10px 10px; 
#             }}
#             .booking-details {{ 
#                 background: white; 
#                 padding: 20px; 
#                 border-radius: 8px; 
#                 margin: 20px 0; 
#                 border-left: 4px solid #667eea;
#             }}
#             .detail-row {{ 
#                 padding: 10px 0; 
#                 border-bottom: 1px solid #e5e7eb; 
#             }}
#             .detail-row:last-child {{
#                 border-bottom: none;
#             }}
#             .button {{ 
#                 display: inline-block; 
#                 padding: 12px 30px; 
#                 background: #667eea; 
#                 color: white; 
#                 text-decoration: none; 
#                 border-radius: 6px; 
#                 margin-top: 20px; 
#             }}
#             .footer {{
#                 text-align: center;
#                 padding: 20px;
#                 color: #6b7280;
#                 font-size: 14px;
#             }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <div class="header">
#                 <h1 style="margin: 0;">🎉 Booking Confirmed!</h1>
#                 <p style="margin: 10px 0 0 0;">Your booking has been successfully created</p>
#             </div>
#             <div class="content">
#                 <p>Hi <strong>{client['name']}</strong>,</p>
#                 <p>Your booking with <strong>{provider['name']}</strong> has been confirmed!</p>
                
#                 <div class="booking-details">
#                     <div class="detail-row">
#                         <strong>📋 Service:</strong> {service_title}
#                     </div>
#                     <div class="detail-row">
#                         <strong>📅 Date & Time:</strong> {start_time.strftime('%B %d, %Y at %I:%M %p')}
#                     </div>
#                     <div class="detail-row">
#                         <strong>⏱️ Duration:</strong> {booking['duration_minutes']} minutes
#                     </div>
#                     <div class="detail-row">
#                         <strong>💰 Price:</strong> ${booking['price']}
#                     </div>
#                     {f'''<div class="detail-row">
#                         <strong>🎥 Meeting Link:</strong> <a href="{booking.get('meeting_link')}" style="color: #667eea;">{booking.get('meeting_link')}</a>
#                     </div>''' if booking.get('meeting_link') else ''}
#                 </div>
                
#                 <p>📧 A reminder will be sent 24 hours before your booking.</p>
                
#                 <div style="text-align: center;">
#                     <a href="http://localhost:3000/buyer-dashboard" class="button">View Booking Details</a>
#                 </div>
                
#                 {f'''<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
#                     <strong>📝 Notes:</strong> {booking['notes']}
#                 </div>''' if booking.get('notes') else ''}
#             </div>
#             <div class="footer">
#                 <p>Thanks for using NovoMarket!</p>
#                 <p style="font-size: 12px; color: #9ca3af;">If you didn't make this booking, please contact support.</p>
#             </div>
#         </div>
#     </body>
#     </html>
#     """

# def get_booking_reminder_email(booking: Dict, client: Dict, service_title: str) -> str:
#     """Reminder email 24 hours before booking"""
#     start_time = datetime.fromisoformat(booking['start_time'])
    
#     return f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ 
#                 font-family: Arial, sans-serif; 
#                 padding: 20px; 
#                 margin: 0;
#                 background-color: #f9fafb;
#             }}
#             .container {{
#                 max-width: 600px; 
#                 margin: 0 auto;
#                 background: white;
#                 border-radius: 10px;
#                 overflow: hidden;
#                 box-shadow: 0 4px 6px rgba(0,0,0,0.1);
#             }}
#             .header {{
#                 background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
#                 color: white;
#                 padding: 30px;
#                 text-align: center;
#             }}
#             .content {{
#                 padding: 30px;
#             }}
#             .reminder-box {{
#                 background: #fef3c7;
#                 padding: 20px;
#                 border-radius: 8px;
#                 margin: 20px 0;
#                 border-left: 4px solid #f59e0b;
#             }}
#             .button {{
#                 display: inline-block;
#                 padding: 12px 30px;
#                 background: #f59e0b;
#                 color: white;
#                 text-decoration: none;
#                 border-radius: 6px;
#                 margin-top: 15px;
#             }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <div class="header">
#                 <h2 style="margin: 0;">⏰ Booking Reminder</h2>
#                 <p style="margin: 10px 0 0 0;">Your booking is coming up soon!</p>
#             </div>
#             <div class="content">
#                 <p>Hi <strong>{client['name']}</strong>,</p>
#                 <p>This is a friendly reminder about your upcoming booking tomorrow:</p>
                
#                 <div class="reminder-box">
#                     <p style="margin: 5px 0;"><strong>📋 Service:</strong> {service_title}</p>
#                     <p style="margin: 5px 0;"><strong>📅 Date & Time:</strong> {start_time.strftime('%B %d, %Y at %I:%M %p')}</p>
#                     <p style="margin: 5px 0;"><strong>👤 Provider:</strong> {booking['provider_name']}</p>
#                     <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> {booking['duration_minutes']} minutes</p>
#                     {f'<p style="margin: 5px 0;"><strong>🎥 Meeting Link:</strong> <a href="{booking.get("meeting_link")}" style="color: #f59e0b;">{booking.get("meeting_link")}</a></p>' if booking.get('meeting_link') else ''}
#                 </div>
                
#                 <p>Please make sure you're ready for your session. If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
                
#                 <div style="text-align: center;">
#                     <a href="http://localhost:3000/buyer-dashboard" class="button">View Booking Details</a>
#                 </div>
                
#                 <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">See you tomorrow! 👋</p>
#             </div>
#         </div>
#     </body>
#     </html>
#     """

# def get_booking_cancellation_email(booking: Dict, user: Dict, service_title: str, cancelled_by: str) -> str:
#     """Cancellation email"""
#     return f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ 
#                 font-family: Arial, sans-serif; 
#                 padding: 20px;
#                 margin: 0;
#                 background-color: #f9fafb;
#             }}
#             .container {{
#                 max-width: 600px; 
#                 margin: 0 auto;
#                 background: white;
#                 border-radius: 10px;
#                 overflow: hidden;
#                 box-shadow: 0 4px 6px rgba(0,0,0,0.1);
#             }}
#             .header {{
#                 background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
#                 color: white;
#                 padding: 30px;
#                 text-align: center;
#             }}
#             .content {{
#                 padding: 30px;
#             }}
#             .cancellation-box {{
#                 background: #fee2e2;
#                 padding: 20px;
#                 border-radius: 8px;
#                 margin: 20px 0;
#                 border-left: 4px solid #ef4444;
#             }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <div class="header">
#                 <h2 style="margin: 0;">❌ Booking Cancelled</h2>
#             </div>
#             <div class="content">
#                 <p>Hi <strong>{user['name']}</strong>,</p>
#                 <p>A booking has been cancelled.</p>
                
#                 <div class="cancellation-box">
#                     <p style="margin: 5px 0;"><strong>📋 Service:</strong> {service_title}</p>
#                     <p style="margin: 5px 0;"><strong>🚫 Cancelled by:</strong> {cancelled_by}</p>
#                     <p style="margin: 5px 0;"><strong>📅 Original Date:</strong> {datetime.fromisoformat(booking['start_time']).strftime('%B %d, %Y at %I:%M %p')}</p>
#                 </div>
                
#                 <p>If you have any questions, please contact support.</p>
#             </div>
#         </div>
#     </body>
#     </html>
#     """

# def get_new_message_email(sender_name: str, receiver_name: str, message_preview: str) -> str:
#     """New message notification email"""
#     return f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ font-family: Arial, sans-serif; padding: 20px; }}
#             .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
#             .header {{ background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
#             .content {{ padding: 30px; }}
#             .message-box {{ background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }}
#             .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <div class="header">
#                 <h2 style="margin: 0;">💬 New Message</h2>
#             </div>
#             <div class="content">
#                 <p>Hi <strong>{receiver_name}</strong>,</p>
#                 <p>You have a new message from <strong>{sender_name}</strong>:</p>
                
#                 <div class="message-box">
#                     <p style="margin: 0;">{message_preview[:100]}...</p>
#                 </div>
                
#                 <div style="text-align: center;">
#                     <a href="http://localhost:3000/messages" class="button">View Message</a>
#                 </div>
#             </div>
#         </div>
#     </body>
#     </html>
#     """

# def get_new_review_email(provider_name: str, reviewer_name: str, rating: float, service_title: str) -> str:
#     """New review notification email"""
#     stars = "⭐" * int(rating)
    
#     return f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ font-family: Arial, sans-serif; padding: 20px; }}
#             .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
#             .header {{ background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
#             .content {{ padding: 30px; }}
#             .review-box {{ background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <div class="header">
#                 <h2 style="margin: 0;">⭐ New Review</h2>
#             </div>
#             <div class="content">
#                 <p>Hi <strong>{provider_name}</strong>,</p>
#                 <p>You received a new review from <strong>{reviewer_name}</strong>!</p>
                
#                 <div class="review-box">
#                     <p style="font-size: 24px; margin: 10px 0;">{stars}</p>
#                     <p><strong>{service_title}</strong></p>
#                 </div>
                
#                 <p style="text-align: center;">
#                     <a href="http://localhost:3000/seller-dashboard" style="display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px;">View Review</a>
#                 </p>
#             </div>
#         </div>
#     </body>
#     </html>
#     """

# # ============ NOTIFICATION CREATION ============

# async def create_notification(
#     user_id: str,
#     notification_type: NotificationType,
#     title: str,
#     message: str,
#     link: Optional[str] = None,
#     data: Dict[str, Any] = {}
# ) -> Notification:
#     """Create and save notification to database"""
    
#     notification = Notification(
#         user_id=user_id,
#         type=notification_type,
#         title=title,
#         message=message,
#         link=link,
#         data=data
#     )
    
#     notif_dict = notification.model_dump()
#     notif_dict['timestamp'] = notif_dict.pop('created_at').isoformat()
    
#     await db.notifications.insert_one(notif_dict)
    
#     return notification

# # ============ BOOKING NOTIFICATIONS ============

# async def send_booking_notifications(booking: Dict):
#     """Send notifications for new booking (both email and in-app)"""
    
#     # Get user and service details
#     client = await db.users.find_one({"id": booking['client_id']}, {"_id": 0})
#     provider = await db.users.find_one({"id": booking['provider_id']}, {"_id": 0})
#     service = await db.listings.find_one({"id": booking['service_id']}, {"_id": 0})
    
#     if not client or not provider or not service:
#         print("⚠️  Missing user or service data for notification")
#         return
    
#     # 1. Send email to client
#     client_email_html = get_booking_confirmation_email(
#         booking, client, provider, service['title']
#     )
#     email_service.send_email(
#         client['email'],
#         "🎉 Booking Confirmed - NovoMarket",
#         client_email_html
#     )
    
#     # 2. Create in-app notification for client
#     await create_notification(
#         user_id=client['id'],
#         notification_type=NotificationType.BOOKING_CONFIRMED,
#         title="Booking Confirmed",
#         message=f"Your booking for '{service['title']}' has been confirmed!",
#         link="/buyer-dashboard",
#         data={"booking_id": booking['id'], "service_id": service['id']}
#     )
    
#     # 3. Send email to provider
#     provider_email_html = f"""
#     <html>
#     <body style="font-family: Arial, sans-serif; padding: 20px;">
#         <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
#             <div style="background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
#                 <h2>🎉 New Booking Received</h2>
#             </div>
#             <div style="padding: 30px;">
#                 <p>Hi <strong>{provider['name']}</strong>,</p>
#                 <p>You have a new booking!</p>
                
#                 <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
#                     <p><strong>Client:</strong> {client['name']}</p>
#                     <p><strong>Service:</strong> {service['title']}</p>
#                     <p><strong>Date & Time:</strong> {datetime.fromisoformat(booking['start_time']).strftime('%B %d, %Y at %I:%M %p')}</p>
#                     <p><strong>Duration:</strong> {booking['duration_minutes']} minutes</p>
#                     <p><strong>Amount:</strong> ${booking['price']}</p>
#                 </div>
                
#                 <p style="text-align: center;">
#                     <a href="http://localhost:3000/seller-dashboard" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">View Booking</a>
#                 </p>
#             </div>
#         </div>
#     </body>
#     </html>
#     """
#     email_service.send_email(
#         provider['email'],
#         "🎉 New Booking - NovoMarket",
#         provider_email_html
#     )
    
#     # 4. Create in-app notification for provider
#     await create_notification(
#         user_id=provider['id'],
#         notification_type=NotificationType.BOOKING_CONFIRMED,
#         title="New Booking Received",
#         message=f"New booking from {client['name']} for '{service['title']}'",
#         link="/seller-dashboard",
#         data={"booking_id": booking['id'], "client_id": client['id']}
#     )
    
#     print(f"✅ Notifications sent for booking {booking['id']}")

# # ============ REMINDER NOTIFICATIONS ============

# async def send_reminder_notifications():
#     """Send reminders for bookings happening in 24 hours (run this via scheduler)"""
    
#     # Get bookings happening in next 24 hours that haven't had reminders sent
#     tomorrow = datetime.utcnow() + timedelta(hours=24)
#     tomorrow_end = tomorrow + timedelta(hours=1)
    
#     bookings = await db.bookings.find({
#         "start_time": {
#             "$gte": tomorrow.isoformat(),
#             "$lt": tomorrow_end.isoformat()
#         },
#         "status": "confirmed",
#         "reminder_sent": False
#     }, {"_id": 0}).to_list(1000)
    
#     for booking in bookings:
#         # Get client and service
#         client = await db.users.find_one({"id": booking['client_id']}, {"_id": 0})
#         service = await db.listings.find_one({"id": booking['service_id']}, {"_id": 0})
        
#         if not client or not service:
#             continue
        
#         # Send reminder email
#         reminder_html = get_booking_reminder_email(booking, client, service['title'])
#         email_service.send_email(
#             client['email'],
#             "⏰ Booking Reminder - Tomorrow",
#             reminder_html
#         )
        
#         # Create in-app notification
#         await create_notification(
#             user_id=client['id'],
#             notification_type=NotificationType.BOOKING_REMINDER,
#             title="Booking Reminder",
#             message=f"Your booking for '{service['title']}' is tomorrow at {datetime.fromisoformat(booking['start_time']).strftime('%I:%M %p')}",
#             link="/buyer-dashboard",
#             data={"booking_id": booking['id']}
#         )
        
#         # Mark reminder as sent
#         await db.bookings.update_one(
#             {"id": booking['id']},
#             {"$set": {"reminder_sent": True}}
#         )
        
#         print(f"✅ Reminder sent for booking {booking['id']}")

# # ============ MESSAGE NOTIFICATIONS ============

# async def send_message_notification(sender_id: str, receiver_id: str, message_text: str):
#     """Send notification for new message"""
    
#     sender = await db.users.find_one({"id": sender_id}, {"_id": 0})
#     receiver = await db.users.find_one({"id": receiver_id}, {"_id": 0})
    
#     if not sender or not receiver:
#         return
    
#     # Send email
#     message_email = get_new_message_email(
#         sender['name'], 
#         receiver['name'], 
#         message_text
#     )
#     email_service.send_email(
#         receiver['email'],
#         f"💬 New message from {sender['name']}",
#         message_email
#     )
    
#     # Create in-app notification
#     await create_notification(
#         user_id=receiver_id,
#         notification_type=NotificationType.NEW_MESSAGE,
#         title="New Message",
#         message=f"{sender['name']} sent you a message",
#         link="/messages",
#         data={"sender_id": sender_id}
#     )

# # ============ REVIEW NOTIFICATIONS ============

# async def send_review_notification(service_id: str, reviewer_id: str, rating: float):
#     """Send notification for new review"""
    
#     service = await db.listings.find_one({"id": service_id}, {"_id": 0})
#     if not service:
#         return
    
#     provider = await db.users.find_one({"id": service['seller_id']}, {"_id": 0})
#     reviewer = await db.users.find_one({"id": reviewer_id}, {"_id": 0})
    
#     if not provider or not reviewer:
#         return
    
#     # Send email
#     review_email = get_new_review_email(
#         provider['name'],
#         reviewer['name'],
#         rating,
#         service['title']
#     )
#     email_service.send_email(
#         provider['email'],
#         f"⭐ New {rating}-star Review",
#         review_email
#     )
    
#     # Create in-app notification
#     await create_notification(
#         user_id=provider['id'],
#         notification_type=NotificationType.NEW_REVIEW,
#         title="New Review",
#         message=f"{reviewer['name']} left a {rating}-star review for '{service['title']}'",
#         link="/seller-dashboard",
#         data={"service_id": service_id, "rating": rating}
#     )

# # ============ PAYMENT NOTIFICATIONS ============

# async def send_payment_notification(provider_id: str, amount: float, booking_id: str):
#     """Send notification for payment received"""
    
#     provider = await db.users.find_one({"id": provider_id}, {"_id": 0})
#     if not provider:
#         return
    
#     # Create in-app notification
#     await create_notification(
#         user_id=provider_id,
#         notification_type=NotificationType.PAYMENT_RECEIVED,
#         title="Payment Received",
#         message=f"You received ${amount:.2f} for a completed booking",
#         link="/seller-dashboard",
#         data={"booking_id": booking_id, "amount": amount}
#     )
    
#     # Send email
#     payment_email = f"""
#     <html>
#     <body style="font-family: Arial, sans-serif; padding: 20px;">
#         <div style="max-width: 600px; margin: 0 auto;">
#             <div style="background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
#                 <h2>💰 Payment Received</h2>
#             </div>
#             <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px;">
#                 <p>Hi <strong>{provider['name']}</strong>,</p>
#                 <p>Great news! You've received a payment.</p>
                
#                 <div style="background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
#                     <p style="font-size: 36px; margin: 0; color: #10b981; font-weight: bold;">${amount:.2f}</p>
#                     <p style="margin: 10px 0 0 0; color: #059669;">Payment Confirmed</p>
#                 </div>
                
#                 <p>The amount will be transferred to your account within 3-5 business days.</p>
#             </div>
#         </div>
#     </body>
#     </html>
#     """
#     email_service.send_email(
#         provider['email'],
#         f"💰 Payment Received - ${amount:.2f}",
#         payment_email
#     )

# print("✅ Notification service loaded successfully!")