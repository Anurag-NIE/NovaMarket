# backend/routes/service_request_routes.py - COMPLETE & FIXED
"""
Service Request Routes - Freelance/Project Board Feature
Allows buyers to post service requests and sellers to submit proposals
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
from database import get_db
from utils.auth_utils import get_current_user
from models import User, ServiceRequest, Proposal, FreelancerProfile
from services.notification_service import create_notification
import uuid

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])


# ============ HELPER FUNCTIONS ============

async def calculate_match_score(db, freelancer_id: str, request_id: str) -> int:
    """Calculate AI match score between freelancer and service request"""
    
    # Get freelancer profile
    profile = await db.freelancer_profiles.find_one(
        {"user_id": freelancer_id},
        {"_id": 0}
    )
    
    # Get service request
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not profile or not request:
        return 0
    
    score = 0
    
    # 1. Skills Match (40 points)
    freelancer_skills = set(profile.get('skills', []))
    required_skills = set(request.get('skills_required', []))
    
    if required_skills:
        skill_match = len(freelancer_skills & required_skills) / len(required_skills)
        score += int(skill_match * 40)
    
    # 2. Experience Level Match (20 points)
    exp_mapping = {"beginner": 0, "intermediate": 1, "expert": 2}
    req_exp = exp_mapping.get(request.get('experience_level', 'intermediate'), 1)
    profile_exp = profile.get('experience_years', 0)
    
    if profile_exp >= req_exp * 2:
        score += 20
    elif profile_exp >= req_exp:
        score += 10
    
    # 3. Budget Compatibility (15 points)
    hourly_rate = profile.get('hourly_rate')
    budget = request.get('budget')
    
    if hourly_rate and budget:
        estimated_hours = budget / hourly_rate if hourly_rate > 0 else 0
        if 10 <= estimated_hours <= 100:  # Reasonable project size
            score += 15
        elif estimated_hours > 5:
            score += 8
    
    # 4. Success Rate (15 points)
    success_rate = profile.get('success_rate', 0)
    if success_rate >= 90:
        score += 15
    elif success_rate >= 70:
        score += 10
    elif success_rate >= 50:
        score += 5
    
    # 5. Category Match (10 points)
    if profile.get('categories'):
        if request.get('category') in profile.get('categories', []):
            score += 10
    
    return min(score, 100)


async def notify_matched_freelancers(db, request_id: str):
    """Notify freelancers with high match scores about new service request"""
    
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        return
    
    # Get all freelancers
    freelancers = await db.users.find(
        {"role": "seller"},
        {"_id": 0}
    ).to_list(1000)
    
    # Calculate match scores and notify top matches
    for freelancer in freelancers:
        match_score = await calculate_match_score(db, freelancer['id'], request_id)
        
        # Notify if match score is high (>60%)
        if match_score >= 60:
            try:
                await create_notification(
                    user_id=freelancer['id'],
                    notification_type="new_opportunity",
                    title=f"New Project Match ({match_score}% fit) 🎯",
                    message=f"A new project matches your skills: {request['title']}",
                    link=f"/service-requests/{request_id}",
                    data={
                        "request_id": request_id,
                        "match_score": match_score
                    }
                )
            except Exception as e:
                print(f"Failed to notify freelancer {freelancer['id']}: {e}")


# ============ SERVICE REQUEST ROUTES ============

@router.post("")
async def create_service_request(
    title: str,
    description: str,
    category: str,
    budget: float,
    deadline: str,
    skills_required: List[str] = [],
    experience_level: str = "intermediate",
    current_user: User = Depends(get_current_user)
):
    """Create a new service request (buyers post work)"""
    db = get_db()
    
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can post service requests")
    
    try:
        deadline_dt = datetime.fromisoformat(deadline)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid deadline format. Use ISO format.")
    
    request = {
        "id": str(uuid.uuid4()),
        "client_id": current_user.id,
        "client_name": current_user.name,
        "title": title,
        "description": description,
        "category": category,
        "budget": budget,
        "deadline": deadline_dt.isoformat(),
        "skills_required": skills_required,
        "experience_level": experience_level,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.service_requests.insert_one(request)
    
    # Trigger AI matching for relevant freelancers
    try:
        await notify_matched_freelancers(db, request["id"])
    except Exception as e:
        print(f"Failed to notify freelancers: {e}")
    
    return {
        "message": "Service request created successfully",
        "request_id": request["id"],
        "request": request
    }


@router.get("")
async def get_service_requests(
    category: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    experience_level: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Browse all service requests (for freelancers) or own requests (for buyers)"""
    db = get_db()
    
    query = {}
    
    # Buyers see only their own requests
    if current_user.role == "buyer":
        query["client_id"] = current_user.id
    else:
        # Sellers see open requests only
        query["status"] = "open"
    
    # Apply filters
    if category:
        query["category"] = category
    if min_budget:
        query["budget"] = {"$gte": min_budget}
    if max_budget:
        if "budget" in query:
            query["budget"]["$lte"] = max_budget
        else:
            query["budget"] = {"$lte": max_budget}
    if experience_level:
        query["experience_level"] = experience_level
    if status and current_user.role == "buyer":
        query["status"] = status
    
    requests = await db.service_requests.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add additional data for each request
    result = []
    for req in requests:
        # Count proposals
        proposal_count = await db.proposals.count_documents({
            "service_request_id": req["id"]
        })
        
        req_dict = {
            **req,
            "proposal_count": proposal_count
        }
        
        # Add AI match score for sellers
        if current_user.role == "seller":
            match_score = await calculate_match_score(db, current_user.id, req["id"])
            req_dict["ai_match_score"] = match_score
        
        result.append(req_dict)
    
    # Sort by match score if seller
    if current_user.role == "seller":
        result.sort(key=lambda x: x.get("ai_match_score", 0), reverse=True)
    
    return {"requests": result, "total": len(result)}


@router.get("/{request_id}")
async def get_service_request_details(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a service request"""
    db = get_db()
    
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Count proposals
    proposal_count = await db.proposals.count_documents({
        "service_request_id": request_id
    })
    
    request["proposal_count"] = proposal_count
    
    # Add match score for sellers
    if current_user.role == "seller":
        match_score = await calculate_match_score(db, current_user.id, request_id)
        request["ai_match_score"] = match_score
        
        # Check if already applied
        existing_proposal = await db.proposals.find_one({
            "service_request_id": request_id,
            "freelancer_id": current_user.id
        }, {"_id": 0})
        
        request["has_applied"] = existing_proposal is not None
        if existing_proposal:
            request["my_proposal"] = existing_proposal
    
    return {"request": request}


@router.post("/{request_id}/proposals")
async def submit_proposal(
    request_id: str,
    cover_letter: str,
    proposed_price: float,
    delivery_time_days: int,
    current_user: User = Depends(get_current_user)
):
    """Submit a proposal for a service request (freelancers apply)"""
    db = get_db()
    
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can submit proposals")
    
    # Get service request
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if request["status"] != "open":
        raise HTTPException(status_code=400, detail="This service request is no longer accepting proposals")
    
    # Check if already applied
    existing = await db.proposals.find_one({
        "service_request_id": request_id,
        "freelancer_id": current_user.id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a proposal for this request")
    
    # Calculate AI match score
    match_score = await calculate_match_score(db, current_user.id, request_id)
    
    proposal = {
        "id": str(uuid.uuid4()),
        "service_request_id": request_id,
        "freelancer_id": current_user.id,
        "freelancer_name": current_user.name,
        "cover_letter": cover_letter,
        "proposed_price": proposed_price,
        "delivery_time_days": delivery_time_days,
        "ai_match_score": match_score,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.proposals.insert_one(proposal)
    
    # Notify client
    try:
        await create_notification(
            user_id=request["client_id"],
            notification_type="new_proposal",
            title="New Proposal Received 📬",
            message=f"{current_user.name} submitted a proposal for '{request['title']}'",
            link=f"/service-requests/{request_id}/proposals",
            data={
                "request_id": request_id,
                "proposal_id": proposal["id"],
                "freelancer_id": current_user.id
            }
        )
    except Exception as e:
        print(f"Failed to notify client: {e}")
    
    return {
        "message": "Proposal submitted successfully",
        "proposal_id": proposal["id"],
        "proposal": proposal
    }


@router.get("/{request_id}/proposals")
async def get_proposals(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all proposals for a service request (client view)"""
    db = get_db()
    
    # Get service request
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Only the client can view proposals
    if request["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the request creator can view proposals")
    
    # Get all proposals
    proposals = await db.proposals.find(
        {"service_request_id": request_id},
        {"_id": 0}
    ).sort("ai_match_score", -1).to_list(100)
    
    # Enrich with freelancer data
    result = []
    for proposal in proposals:
        # Get freelancer info
        freelancer = await db.users.find_one(
            {"id": proposal["freelancer_id"]},
            {"_id": 0, "password": 0}
        )
        
        if not freelancer:
            continue
        
        # Get freelancer profile
        profile = await db.freelancer_profiles.find_one(
            {"user_id": proposal["freelancer_id"]},
            {"_id": 0}
        )
        
        proposal_data = {
            **proposal,
            "freelancer_name": freelancer.get("name", "Unknown"),
            "freelancer_email": freelancer.get("email"),
            "freelancer_title": profile.get("title") if profile else "Freelancer",
            "freelancer_rating": freelancer.get("rating", 0),
            "completed_projects": profile.get("completed_projects", 0) if profile else 0,
            "success_rate": profile.get("success_rate", 0) if profile else 0,
            "hourly_rate": profile.get("hourly_rate") if profile else None,
            "skills": profile.get("skills", []) if profile else []
        }
        
        result.append(proposal_data)
    
    return {
        "proposals": result,
        "total": len(result),
        "request": request
    }


@router.post("/{request_id}/proposals/{proposal_id}/accept")
async def accept_proposal(
    request_id: str,
    proposal_id: str,
    current_user: User = Depends(get_current_user)
):
    """Accept a proposal and start work"""
    db = get_db()
    
    # Get service request
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request or request["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Get proposal
    proposal = await db.proposals.find_one(
        {"id": proposal_id},
        {"_id": 0}
    )
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # Update proposal status
    await db.proposals.update_one(
        {"id": proposal_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Update request status
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "in_progress", "accepted_proposal_id": proposal_id}}
    )
    
    # Reject other proposals
    await db.proposals.update_many(
        {
            "service_request_id": request_id,
            "id": {"$ne": proposal_id}
        },
        {"$set": {"status": "rejected"}}
    )
    
    # Notify accepted freelancer
    try:
        await create_notification(
            user_id=proposal["freelancer_id"],
            notification_type="proposal_accepted",
            title="Proposal Accepted! 🎉",
            message=f"Your proposal for '{request['title']}' has been accepted!",
            link="/seller-dashboard",
            data={
                "request_id": request_id,
                "proposal_id": proposal_id
            }
        )
    except Exception as e:
        print(f"Failed to notify freelancer: {e}")
    
    return {
        "message": "Proposal accepted successfully",
        "request": request
    }


@router.post("/{request_id}/complete")
async def complete_service_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark service request as completed"""
    db = get_db()
    
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Only client can mark as completed
    if request["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify freelancer if there's an accepted proposal
    if request.get("accepted_proposal_id"):
        proposal = await db.proposals.find_one(
            {"id": request["accepted_proposal_id"]},
            {"_id": 0}
        )
        
        if proposal:
            try:
                await create_notification(
                    user_id=proposal["freelancer_id"],
                    notification_type="project_completed",
                    title="Project Completed ✅",
                    message=f"'{request['title']}' has been marked as completed",
                    link="/seller-dashboard",
                    data={"request_id": request_id}
                )
            except Exception as e:
                print(f"Failed to notify freelancer: {e}")
    
    return {"message": "Service request marked as completed"}


@router.delete("/{request_id}")
async def delete_service_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a service request (only if no accepted proposals)"""
    db = get_db()
    
    request = await db.service_requests.find_one(
        {"id": request_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if request["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if request["status"] == "in_progress":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a service request that is in progress"
        )
    
    await db.service_requests.delete_one({"id": request_id})
    await db.proposals.delete_many({"service_request_id": request_id})
    
    return {"message": "Service request deleted successfully"}


print("✅ Service Request routes loaded successfully!")