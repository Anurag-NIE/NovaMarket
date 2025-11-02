import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

async def calculate_match_score(db: Session, freelancer_id: str, request_id: str) -> int:
    """Calculate AI match score between freelancer and service request"""
    
    # Get freelancer profile
    profile = db.query(FreelancerProfile).filter(
        FreelancerProfile.user_id == freelancer_id
    ).first()
    
    # Get service request
    request = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id
    ).first()
    
    if not profile or not request:
        return 0
    
    score = 0
    
    # 1. Skills Match (40 points)
    freelancer_skills = set(profile.skills or [])
    required_skills = set(request.skills_required or [])
    
    if required_skills:
        skill_match = len(freelancer_skills & required_skills) / len(required_skills)
        score += int(skill_match * 40)
    
    # 2. Experience Level Match (20 points)
    exp_mapping = {"beginner": 0, "intermediate": 1, "expert": 2}
    req_exp = exp_mapping.get(request.experience_level, 1)
    
    if profile.experience_years >= req_exp * 2:
        score += 20
    elif profile.experience_years >= req_exp:
        score += 10
    
    # 3. Budget Compatibility (15 points)
    if profile.hourly_rate and request.budget:
        estimated_hours = request.budget / profile.hourly_rate
        if 10 <= estimated_hours <= 100:  # Reasonable project size
            score += 15
        elif estimated_hours > 5:
            score += 8
    
    # 4. Success Rate (15 points)
    if profile.success_rate >= 90:
        score += 15
    elif profile.success_rate >= 70:
        score += 10
    elif profile.success_rate >= 50:
        score += 5
    
    # 5. Category Match (10 points)
    # You can add category expertise to FreelancerProfile
    score += 10
    
    return min(score, 100)

async def get_personalized_recommendations(
    db: Session,
    user_id: str,
    limit: int = 12
) -> List[dict]:
    """Get AI-powered personalized service recommendations"""
    
    # Get user's past bookings and interactions
    bookings = db.query(Booking).filter(Booking.client_id == user_id).all()
    
    # Build user preference profile
    categories = [b.service.category for b in bookings if b.service]
    skills = []
    for b in bookings:
        if b.service and b.service.tags:
            skills.extend(b.service.tags)
    
    # Get all services
    services = db.query(Listing).filter(Listing.type == "service").all()
    
    # Calculate scores
    recommendations = []
    for service in services:
        score = 0
        reason = ""
        
        # Category match
        if service.category in categories:
            score += 30
            reason = f"Based on your interest in {service.category}"
        
        # Tag/skill match
        if service.tags:
            matching_tags = set(service.tags) & set(skills)
            if matching_tags:
                score += 25
                reason = f"Matches your interests: {', '.join(list(matching_tags)[:2])}"
        
        # Rating
        if service.rating >= 4.5:
            score += 20
            reason = "Highly rated service"
        
        # Trending
        booking_count = db.query(Booking).filter(
            Booking.service_id == service.id,
            Booking.created_at >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        if booking_count >= 5:
            score += 15
            reason = "Trending in your area"
        
        # New service
        if service.created_at >= datetime.utcnow() - timedelta(days=7):
            score += 10
        
        if score > 0:
            recommendations.append({
                "service_id": service.id,
                "title": service.title,
                "provider_name": service.seller_name,
                "price": service.price,
                "rating": service.rating,
                "image": service.images[0] if service.images else None,
                "match_score": score,
                "reason": reason,
                "tags": service.tags
            })
    
    # Sort by score and return top results
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations[:limit]

async def get_trending_services(db: Session, limit: int = 12) -> List[dict]:
    """Get trending services based on recent activity"""
    
    # Get services with most bookings in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    trending = db.query(
        Listing.id,
        Listing.title,
        Listing.price,
        Listing.rating,
        Listing.images,
        User.name.label("seller_name"),
        func.count(Booking.id).label("booking_count")
    ).join(
        Booking, Booking.service_id == Listing.id
    ).join(
        User, User.id == Listing.seller_id
    ).filter(
        Listing.type == "service",
        Booking.created_at >= thirty_days_ago
    ).group_by(
        Listing.id
    ).order_by(
        func.count(Booking.id).desc()
    ).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "title": t.title,
            "price": t.price,
            "rating": t.rating,
            "images": t.images,
            "seller_name": t.seller_name,
            "trending_score": t.booking_count
        }
        for t in trending
    ]