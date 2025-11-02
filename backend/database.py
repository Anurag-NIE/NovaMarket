# # backend/database.py - NEW FILE
# from motor.motor_asyncio import AsyncIOMotorClient
# import redis
# import os
# from dotenv import load_dotenv

# load_dotenv()

# # MongoDB
# mongo_url = os.environ['MONGO_URL']
# mongo_client = AsyncIOMotorClient(mongo_url)
# db = mongo_client[os.environ['DB_NAME']]

# # Redis
# redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
# redis_client = redis.from_url(redis_url, decode_responses=True)

# # Collections (for reference)
# """
# Collections:
# - users
# - listings
# - orders
# - reviews
# - messages
# - wishlist
# - payment_transactions
# - bookings (NEW)
# - availability (NEW)
# - notifications (NEW)
# - pricing_rules (NEW)
# """

# async def init_indexes():
#     """Create database indexes for better performance"""
    
#     # Users
#     await db.users.create_index("email", unique=True)
#     await db.users.create_index("id", unique=True)
    
#     # Listings
#     await db.listings.create_index("id", unique=True)
#     await db.listings.create_index("seller_id")
#     await db.listings.create_index("category")
#     await db.listings.create_index([("title", "text"), ("description", "text")])
    
#     # Bookings (NEW)
#     await db.bookings.create_index("id", unique=True)
#     await db.bookings.create_index("client_id")
#     await db.bookings.create_index("provider_id")
#     await db.bookings.create_index("service_id")
#     await db.bookings.create_index("start_time")
#     await db.bookings.create_index([("service_id", 1), ("start_time", 1)])
    
#     # Availability (NEW)
#     await db.availability.create_index([("service_id", 1), ("day_of_week", 1)])
    
#     # Notifications (NEW)
#     await db.notifications.create_index("user_id")
#     await db.notifications.create_index([("user_id", 1), ("read", 1)])
#     await db.notifications.create_index("timestamp")
    
#     print("✅ Database indexes created")

# # Export
# __all__ = ['db', 'redis_client', 'init_indexes']










# backend/database.py - COMPLETE & ENHANCED
"""
Complete Database Module with Connection Management
- MongoDB connection with Motor (async)
- Redis connection for caching/locking
- Database indexes for performance
- Helper functions
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import redis
import os
from pathlib import Path
from typing import Optional
import logging

from config import settings

logger = logging.getLogger(__name__)

# ============ DATABASE CONNECTION ============

class Database:
    """MongoDB database connection manager"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
    
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGO_URL,
                serverSelectionTimeoutMS=5000
            )
            self.db = self.client[settings.DB_NAME]
            logger.info(f"✅ Connected to MongoDB: {settings.DB_NAME}")
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise
    
    async def ping(self) -> bool:
        """Check if database is accessible"""
        try:
            await self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"❌ Database ping failed: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("✅ MongoDB connection closed")
    
    def __getattr__(self, name):
        """Allow direct access to collections via database.collection_name"""
        if self.db is None:
            raise AttributeError("Database not connected. Call connect() first.")
        return self.db[name]


# Create global database instance
database = Database()


def get_db():
    """Get database instance for use in routes"""
    if database.db is None:
        database.connect()
    return database.db


# ============ REDIS CONNECTION ============

def connect_redis() -> Optional[redis.Redis]:
    """Connect to Redis for caching and slot locking"""
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2
        )
        # Test connection
        client.ping()
        logger.info("✅ Connected to Redis")
        return client
    except Exception as e:
        logger.warning(f"⚠️  Redis connection failed: {e}")
        logger.warning("📝 Slot locking will be disabled without Redis")
        return None


# Create global Redis instance
redis_client = connect_redis()


# ============ DATABASE INDEXES ============

async def init_indexes():
    """
    Initialize database indexes for optimal performance
    Call this on application startup
    """
    db = get_db()
    
    try:
        # Users indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.users.create_index("role")
        logger.info("✅ Users indexes created")
        
        # Listings indexes
        await db.listings.create_index("id", unique=True)
        await db.listings.create_index("seller_id")
        await db.listings.create_index("category")
        await db.listings.create_index("type")
        await db.listings.create_index([("title", "text"), ("description", "text")])
        await db.listings.create_index("rating")
        await db.listings.create_index("timestamp")
        logger.info("✅ Listings indexes created")
        
        # Bookings indexes
        await db.bookings.create_index("id", unique=True)
        await db.bookings.create_index("service_id")
        await db.bookings.create_index("provider_id")
        await db.bookings.create_index("client_id")
        await db.bookings.create_index("status")
        await db.bookings.create_index("start_time")
        await db.bookings.create_index([("service_id", 1), ("start_time", 1)])
        await db.bookings.create_index("timestamp")
        logger.info("✅ Bookings indexes created")
        
        # Availability indexes
        await db.availability.create_index([("service_id", 1), ("day_of_week", 1)], unique=True)
        await db.availability.create_index("provider_id")
        logger.info("✅ Availability indexes created")
        
        # Slot locks indexes (TTL index for auto-expiry)
        await db.slot_locks.create_index(
            "expireAt", 
            expireAfterSeconds=0
        )
        await db.slot_locks.create_index([("service_id", 1), ("start_time", 1)], unique=True)
        logger.info("✅ Slot locks indexes created")
        
        # Reviews indexes
        await db.reviews.create_index("id", unique=True)
        await db.reviews.create_index("listing_id")
        await db.reviews.create_index("user_id")
        await db.reviews.create_index("timestamp")
        logger.info("✅ Reviews indexes created")
        
        # Orders indexes
        await db.orders.create_index("id", unique=True)
        await db.orders.create_index("buyer_id")
        await db.orders.create_index("seller_id")
        await db.orders.create_index("listing_id")
        await db.orders.create_index("status")
        await db.orders.create_index("timestamp")
        logger.info("✅ Orders indexes created")
        
        # Messages indexes
        await db.messages.create_index("id", unique=True)
        await db.messages.create_index([("sender_id", 1), ("receiver_id", 1)])
        await db.messages.create_index("timestamp")
        await db.messages.create_index("read")
        logger.info("✅ Messages indexes created")
        
        # Notifications indexes
        await db.notifications.create_index("id", unique=True)
        await db.notifications.create_index("user_id")
        await db.notifications.create_index("read")
        await db.notifications.create_index("timestamp")
        logger.info("✅ Notifications indexes created")
        
        # Wishlist indexes
        await db.wishlist.create_index("id", unique=True)
        await db.wishlist.create_index([("user_id", 1), ("listing_id", 1)], unique=True)
        logger.info("✅ Wishlist indexes created")
        
        # Payment transactions indexes
        await db.payment_transactions.create_index("id", unique=True)
        await db.payment_transactions.create_index("session_id", unique=True)
        await db.payment_transactions.create_index("order_id")
        await db.payment_transactions.create_index("buyer_id")
        await db.payment_transactions.create_index("payment_status")
        logger.info("✅ Payment transactions indexes created")
        
        logger.info("🎉 All database indexes initialized successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to create indexes: {e}")
        raise


# ============ DATABASE HELPER FUNCTIONS ============

async def clear_expired_locks():
    """Clear expired slot locks (if not using Redis TTL)"""
    db = get_db()
    from datetime import datetime, timezone
    
    try:
        result = await db.slot_locks.delete_many({
            "expireAt": {"$lt": datetime.utcnow()}
        })
        if result.deleted_count > 0:
            logger.info(f"🧹 Cleared {result.deleted_count} expired slot locks")
    except Exception as e:
        logger.error(f"❌ Failed to clear expired locks: {e}")


async def get_collection_stats() -> dict:
    """Get statistics about database collections"""
    db = get_db()
    
    try:
        stats = {
            "users": await db.users.count_documents({}),
            "listings": await db.listings.count_documents({}),
            "bookings": await db.bookings.count_documents({}),
            "orders": await db.orders.count_documents({}),
            "reviews": await db.reviews.count_documents({}),
            "messages": await db.messages.count_documents({}),
            "notifications": await db.notifications.count_documents({}),
        }
        return stats
    except Exception as e:
        logger.error(f"❌ Failed to get collection stats: {e}")
        return {}


async def reset_database():
    """
    DANGER: Reset entire database (for development only)
    Use with extreme caution!
    """
    if not settings.DEBUG:
        raise Exception("Database reset is only allowed in DEBUG mode")
    
    db = get_db()
    
    logger.warning("⚠️  RESETTING DATABASE - ALL DATA WILL BE LOST!")
    
    collections = await db.list_collection_names()
    
    for collection in collections:
        await db[collection].delete_many({})
        logger.info(f"🗑️  Cleared collection: {collection}")
    
    logger.warning("✅ Database reset complete")


# ============ HEALTH CHECK ============

async def check_database_health() -> dict:
    """Comprehensive database health check"""
    health = {
        "mongodb": {"status": "unknown", "message": ""},
        "redis": {"status": "unknown", "message": ""},
    }
    
    # Check MongoDB
    try:
        if await database.ping():
            health["mongodb"] = {
                "status": "healthy",
                "message": "Connected",
                "database": settings.DB_NAME
            }
        else:
            health["mongodb"] = {
                "status": "unhealthy",
                "message": "Connection failed"
            }
    except Exception as e:
        health["mongodb"] = {
            "status": "unhealthy",
            "message": str(e)
        }
    
    # Check Redis
    try:
        if redis_client:
            redis_client.ping()
            health["redis"] = {
                "status": "healthy",
                "message": "Connected"
            }
        else:
            health["redis"] = {
                "status": "disabled",
                "message": "Redis not configured"
            }
    except Exception as e:
        health["redis"] = {
            "status": "unhealthy",
            "message": str(e)
        }
    
    return health


logger.info("✅ Database module loaded successfully")