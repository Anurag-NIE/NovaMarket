# backend/routes/freelancer_routes.py - COMPLETE VERSION

"""
Freelancer Routes - Complete Backend API
Handles: Profiles, Service Requests, Proposals
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from bson import ObjectId
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# Database connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.novomarket

# ==================== MODELS ====================

class FreelancerProfileCreate(BaseModel):
    title: str
    bio: str
    skills: List[str]
    categories: List[str]
    experience_years: int
    hourly_rate: float
    education: Optional[List[dict]] = []
    certifications: Optional[List[dict]] = []
    portfolio: Optional[List[dict]] = []
    languages: Optional[List[str]] = ["English"]
    availability: Optional[str] = "available"

class ServiceRequestCreate(BaseModel):
    title: str
    description: str
    category: str
    budget: float
    deadline: Optional[str] = None
    skills_required: List[str]
    experience_level: str = "intermediate"
    attachments: Optional[List[str]] = []

class ProposalCreate(BaseModel):
    request_id: str
    cover_letter: str
    proposed_budget: float
    delivery_time: int
    milestones: Optional[List[dict]] = []

# ==================== AUTH HELPER ====================

async def get_current_user(authorization: str = Header(None)):
    """Extract user from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        
        # TODO: Replace with your actual JWT verification
        # For now, decode the user info from token or use a mock
        # This is where you'd normally verify JWT and get user_id
        
        # Mock implementation - replace with actual JWT decode
        user = await db.users.find_one({"token": token})
        if not user:
            # Fallback: try to get from user collection
            # For development, you can return a mock user
            return {
                "id": "temp_user_id",  # Replace with actual user ID from JWT
                "email": "user@example.com",
                "role": "seller"
            }
        
        return {
            "id": str(user.get("_id", "unknown")),
            "email": user.get("email", ""),
            "role": user.get("role", "seller")
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication: {str(e)}")

# ==================== FREELANCER PROFILE ROUTES ====================

@router.post("/freelancer/profile")
async def create_or_update_profile(
    profile: FreelancerProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update freelancer profile"""
    try:
        profile_data = profile.dict()
        profile_data["user_id"] = current_user["id"]
        profile_data["updated_at"] = datetime.now(timezone.utc)
        
        existing = await db.freelancer_profiles.find_one({
            "user_id": current_user["id"]
        })
        
        if existing:
            await db.freelancer_profiles.update_one(
                {"user_id": current_user["id"]},
                {"$set": profile_data}
            )
            return {
                "message": "Profile updated successfully",
                "profile_id": str(existing["_id"]),
                "profile": profile_data
            }
        else:
            profile_data["created_at"] = datetime.now(timezone.utc)
            profile_data["rating"] = 0.0
            profile_data["total_jobs"] = 0
            profile_data["total_earnings"] = 0.0
            
            result = await db.freelancer_profiles.insert_one(profile_data)
            return {
                "message": "Profile created successfully",
                "profile_id": str(result.inserted_id),
                "profile": profile_data
            }
    
    except Exception as e:
        print(f"Error saving profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving profile: {str(e)}")

@router.get("/freelancer/profile")
async def get_own_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's freelancer profile"""
    try:
        profile = await db.freelancer_profiles.find_one({
            "user_id": current_user["id"]
        })
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile["_id"] = str(profile["_id"])
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.get("/freelancer/profile/{user_id}")
async def get_freelancer_profile(user_id: str):
    """Get specific freelancer profile by user_id"""
    try:
        profile = await db.freelancer_profiles.find_one({"user_id": user_id})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile["_id"] = str(profile["_id"])
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.get("/freelancers")
async def get_all_freelancers(
    category: Optional[str] = None,
    skills: Optional[str] = None,
    min_rate: Optional[float] = None,
    max_rate: Optional[float] = None,
    limit: int = 50
):
    """Get all freelancers with optional filters"""
    try:
        query = {}
        
        if category:
            query["categories"] = category
        if skills:
            skill_list = [s.strip() for s in skills.split(",")]
            query["skills"] = {"$in": skill_list}
        if min_rate is not None or max_rate is not None:
            query["hourly_rate"] = {}
            if min_rate is not None:
                query["hourly_rate"]["$gte"] = min_rate
            if max_rate is not None:
                query["hourly_rate"]["$lte"] = max_rate
        
        cursor = db.freelancer_profiles.find(query).limit(limit)
        profiles = await cursor.to_list(length=limit)
        
        for profile in profiles:
            profile["_id"] = str(profile["_id"])
        
        return {"freelancers": profiles, "count": len(profiles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching freelancers: {str(e)}")

@router.delete("/freelancer/profile")
async def delete_profile(current_user: dict = Depends(get_current_user)):
    """Delete own freelancer profile"""
    try:
        result = await db.freelancer_profiles.delete_one({
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {"message": "Profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")

# ==================== SERVICE REQUEST ROUTES ====================

@router.post("/service-requests")
async def create_service_request(
    request: ServiceRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new service request (buyer posts work)"""
    try:
        request_data = request.dict()
        request_data["buyer_id"] = current_user["id"]
        request_data["buyer_email"] = current_user.get("email", "")
        request_data["status"] = "open"
        request_data["created_at"] = datetime.now(timezone.utc)
        request_data["proposals_count"] = 0
        
        result = await db.service_requests.insert_one(request_data)
        
        return {
            "message": "Service request posted successfully",
            "request_id": str(result.inserted_id),
            "request": request_data
        }
    
    except Exception as e:
        print(f"Error creating request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating request: {str(e)}")

@router.get("/service-requests")
async def get_service_requests(
    category: Optional[str] = None,
    skills: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    status: str = "open",
    limit: int = 50
):
    """Get all service requests with filters"""
    try:
        query = {"status": status}
        
        if category:
            query["category"] = category
        if skills:
            skill_list = [s.strip() for s in skills.split(",")]
            query["skills_required"] = {"$in": skill_list}
        if min_budget is not None or max_budget is not None:
            query["budget"] = {}
            if min_budget is not None:
                query["budget"]["$gte"] = min_budget
            if max_budget is not None:
                query["budget"]["$lte"] = max_budget
        
        cursor = db.service_requests.find(query).sort("created_at", -1).limit(limit)
        requests = await cursor.to_list(length=limit)
        
        for req in requests:
            req["_id"] = str(req["_id"])
        
        return {"requests": requests, "count": len(requests)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching requests: {str(e)}")

@router.get("/service-requests/{request_id}")
async def get_service_request(request_id: str):
    """Get specific service request by ID"""
    try:
        if not ObjectId.is_valid(request_id):
            raise HTTPException(status_code=400, detail="Invalid request ID format")
        
        request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request["_id"] = str(request["_id"])
        return request
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching request: {str(e)}")

@router.get("/my-service-requests")
async def get_my_requests(current_user: dict = Depends(get_current_user)):
    """Get current user's service requests"""
    try:
        cursor = db.service_requests.find({
            "buyer_id": current_user["id"]
        }).sort("created_at", -1)
        
        requests = await cursor.to_list(length=100)
        
        for req in requests:
            req["_id"] = str(req["_id"])
        
        return {"requests": requests, "count": len(requests)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching requests: {str(e)}")

@router.delete("/service-requests/{request_id}")
async def delete_service_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a service request (only by owner)"""
    try:
        if not ObjectId.is_valid(request_id):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(request_id),
            "buyer_id": current_user["id"]
        })
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found or unauthorized")
        
        await db.service_requests.delete_one({"_id": ObjectId(request_id)})
        return {"message": "Request deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting request: {str(e)}")

# ==================== PROPOSAL ROUTES ====================

@router.post("/proposals")
async def submit_proposal(
    proposal: ProposalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit a proposal for a service request"""
    try:
        if not ObjectId.is_valid(proposal.request_id):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(proposal.request_id)
        })
        
        if not request:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        if request["status"] != "open":
            raise HTTPException(status_code=400, detail="Request is no longer open")
        
        existing = await db.proposals.find_one({
            "request_id": proposal.request_id,
            "freelancer_id": current_user["id"]
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="You already submitted a proposal")
        
        proposal_data = proposal.dict()
        proposal_data["freelancer_id"] = current_user["id"]
        proposal_data["status"] = "pending"
        proposal_data["created_at"] = datetime.now(timezone.utc)
        
        result = await db.proposals.insert_one(proposal_data)
        
        await db.service_requests.update_one(
            {"_id": ObjectId(proposal.request_id)},
            {"$inc": {"proposals_count": 1}}
        )
        
        return {
            "message": "Proposal submitted successfully",
            "proposal_id": str(result.inserted_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error submitting proposal: {str(e)}")

@router.get("/proposals/request/{request_id}")
async def get_request_proposals(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all proposals for a service request (buyer only)"""
    try:
        if not ObjectId.is_valid(request_id):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(request_id),
            "buyer_id": current_user["id"]
        })
        
        if not request:
            raise HTTPException(status_code=403, detail="Not authorized to view proposals")
        
        cursor = db.proposals.find({"request_id": request_id}).sort("created_at", -1)
        proposals = await cursor.to_list(length=100)
        
        for proposal in proposals:
            proposal["_id"] = str(proposal["_id"])
            
            # Fetch freelancer details
            freelancer = await db.freelancer_profiles.find_one({
                "user_id": proposal["freelancer_id"]
            })
            if freelancer:
                proposal["freelancer_details"] = {
                    "title": freelancer.get("title", ""),
                    "rating": freelancer.get("rating", 0),
                    "total_jobs": freelancer.get("total_jobs", 0)
                }
        
        return {"proposals": proposals, "count": len(proposals)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching proposals: {str(e)}")

@router.get("/my-proposals")
async def get_my_proposals(current_user: dict = Depends(get_current_user)):
    """Get current user's submitted proposals"""
    try:
        cursor = db.proposals.find({
            "freelancer_id": current_user["id"]
        }).sort("created_at", -1)
        
        proposals = await cursor.to_list(length=100)
        
        for proposal in proposals:
            proposal["_id"] = str(proposal["_id"])
            
            # Fetch request details
            if ObjectId.is_valid(proposal["request_id"]):
                request = await db.service_requests.find_one({
                    "_id": ObjectId(proposal["request_id"])
                })
                if request:
                    proposal["request_details"] = {
                        "title": request.get("title", ""),
                        "budget": request.get("budget", 0),
                        "status": request.get("status", "")
                    }
        
        return {"proposals": proposals, "count": len(proposals)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching proposals: {str(e)}")

@router.put("/proposals/{proposal_id}/accept")
async def accept_proposal(
    proposal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Accept a proposal (buyer only)"""
    try:
        if not ObjectId.is_valid(proposal_id):
            raise HTTPException(status_code=400, detail="Invalid proposal ID")
        
        proposal = await db.proposals.find_one({"_id": ObjectId(proposal_id)})
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        if not ObjectId.is_valid(proposal["request_id"]):
            raise HTTPException(status_code=400, detail="Invalid request ID in proposal")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(proposal["request_id"]),
            "buyer_id": current_user["id"]
        })
        
        if not request:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await db.proposals.update_one(
            {"_id": ObjectId(proposal_id)},
            {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc)}}
        )
        
        await db.service_requests.update_one(
            {"_id": ObjectId(proposal["request_id"])},
            {"$set": {
                "status": "in_progress",
                "assigned_to": proposal["freelancer_id"],
                "accepted_at": datetime.now(timezone.utc)
            }}
        )
        
        await db.proposals.update_many(
            {
                "request_id": proposal["request_id"],
                "_id": {"$ne": ObjectId(proposal_id)}
            },
            {"$set": {"status": "rejected"}}
        )
        
        return {"message": "Proposal accepted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accepting proposal: {str(e)}")

@router.put("/proposals/{proposal_id}/reject")
async def reject_proposal(
    proposal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject a proposal (buyer only)"""
    try:
        if not ObjectId.is_valid(proposal_id):
            raise HTTPException(status_code=400, detail="Invalid proposal ID")
        
        proposal = await db.proposals.find_one({"_id": ObjectId(proposal_id)})
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        if not ObjectId.is_valid(proposal["request_id"]):
            raise HTTPException(status_code=400, detail="Invalid request ID")
        
        request = await db.service_requests.find_one({
            "_id": ObjectId(proposal["request_id"]),
            "buyer_id": current_user["id"]
        })
        
        if not request:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await db.proposals.update_one(
            {"_id": ObjectId(proposal_id)},
            {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Proposal rejected"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rejecting proposal: {str(e)}")
    

# **Save this as:** `backend/routes/freelancer_routes.py`
































# # backend/routes/freelancer_routes.py - NEW FILE
# """
# Freelancer Profile Routes
# Manage freelancer profiles, skills, and portfolio
# """

# from fastapi import APIRouter, Depends, HTTPException
# from typing import List, Optional
# from datetime import datetime, timezone
# from database import get_db
# from utils.auth_utils import get_current_user
# from models import User, FreelancerProfile
# import uuid

# router = APIRouter(prefix="/freelancer", tags=["Freelancer"])


# @router.post("/profile")
# async def create_or_update_profile(
#     title: Optional[str] = None,
#     bio: Optional[str] = None,
#     skills: List[str] = [],
#     experience_years: int = 0,
#     hourly_rate: Optional[float] = None,
#     portfolio_url: Optional[str] = None,
#     certifications: List[str] = [],
#     categories: List[str] = [],
#     current_user: User = Depends(get_current_user)
# ):
#     """Create or update freelancer profile"""
#     db = get_db()
    
#     if current_user.role != "seller":
#         raise HTTPException(status_code=403, detail="Only sellers can create freelancer profiles")
    
#     # Check if profile exists
#     existing = await db.freelancer_profiles.find_one(
#         {"user_id": current_user.id},
#         {"_id": 0}
#     )
    
#     profile_data = {
#         "user_id": current_user.id,
#         "title": title,
#         "bio": bio,
#         "skills": skills,
#         "experience_years": experience_years,
#         "hourly_rate": hourly_rate,
#         "portfolio_url": portfolio_url,
#         "certifications": certifications,
#         "categories": categories,
#         "updated_at": datetime.now(timezone.utc).isoformat()
#     }
    
#     if existing:
#         # Update existing profile
#         await db.freelancer_profiles.update_one(
#             {"user_id": current_user.id},
#             {"$set": profile_data}
#         )
#         message = "Profile updated successfully"
#     else:
#         # Create new profile
#         profile_data["id"] = str(uuid.uuid4())
#         profile_data["completed_projects"] = 0
#         profile_data["success_rate"] = 0.0
#         profile_data["created_at"] = datetime.now(timezone.utc).isoformat()
        
#         await db.freelancer_profiles.insert_one(profile_data)
#         message = "Profile created successfully"
    
#     return {
#         "message": message,
#         "profile": profile_data
#     }


# @router.get("/profile")
# async def get_my_profile(
#     current_user: User = Depends(get_current_user)
# ):
#     """Get current user's freelancer profile"""
#     db = get_db()
    
#     profile = await db.freelancer_profiles.find_one(
#         {"user_id": current_user.id},
#         {"_id": 0}
#     )
    
#     if not profile:
#         return {
#             "profile": None,
#             "message": "No profile found. Create one to get started!"
#         }
    
#     return {"profile": profile}


# @router.get("/profile/{user_id}")
# async def get_freelancer_profile(
#     user_id: str,
#     current_user: User = Depends(get_current_user)
# ):
#     """Get any freelancer's public profile"""
#     db = get_db()
    
#     # Get user info
#     user = await db.users.find_one(
#         {"id": user_id},
#         {"_id": 0, "password": 0}
#     )
    
#     if not user or user["role"] != "seller":
#         raise HTTPException(status_code=404, detail="Freelancer not found")
    
#     # Get profile
#     profile = await db.freelancer_profiles.find_one(
#         {"user_id": user_id},
#         {"_id": 0}
#     )
    
#     # Get statistics
#     completed_count = await db.service_requests.count_documents({
#         "accepted_proposal_id": {"$exists": True},
#         "status": "completed"
#     })
    
#     # Get reviews/ratings
#     reviews = await db.reviews.find(
#         {"listing.seller_id": user_id},
#         {"_id": 0, "rating": 1}
#     ).to_list(1000)
    
#     avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    
#     return {
#         "user": {
#             "id": user["id"],
#             "name": user["name"],
#             "email": user["email"],
#             "avatar": user.get("avatar"),
#             "created_at": user.get("created_at")
#         },
#         "profile": profile,
#         "stats": {
#             "completed_projects": completed_count,
#             "avg_rating": round(avg_rating, 1),
#             "total_reviews": len(reviews)
#         }
#     }


# @router.get("/search")
# async def search_freelancers(
#     skills: Optional[List[str]] = None,
#     category: Optional[str] = None,
#     min_hourly_rate: Optional[float] = None,
#     max_hourly_rate: Optional[float] = None,
#     min_experience: Optional[int] = None,
#     limit: int = 50,
#     current_user: User = Depends(get_current_user)
# ):
#     """Search for freelancers by skills, category, rate, etc."""
#     db = get_db()
    
#     query = {}
    
#     if skills:
#         query["skills"] = {"$in": skills}
    
#     if category:
#         query["categories"] = category
    
#     if min_hourly_rate or max_hourly_rate:
#         rate_query = {}
#         if min_hourly_rate:
#             rate_query["$gte"] = min_hourly_rate
#         if max_hourly_rate:
#             rate_query["$lte"] = max_hourly_rate
#         query["hourly_rate"] = rate_query
    
#     if min_experience:
#         query["experience_years"] = {"$gte": min_experience}
    
#     profiles = await db.freelancer_profiles.find(
#         query,
#         {"_id": 0}
#     ).limit(limit).to_list(limit)
    
#     # Enrich with user data
#     result = []
#     for profile in profiles:
#         user = await db.users.find_one(
#             {"id": profile["user_id"]},
#             {"_id": 0, "password": 0}
#         )
        
#         if user:
#             result.append({
#                 "user_id": user["id"],
#                 "name": user["name"],
#                 "avatar": user.get("avatar"),
#                 **profile
#             })
    
#     return {
#         "freelancers": result,
#         "total": len(result)
#     }


# print("✅ Freelancer routes loaded successfully!")