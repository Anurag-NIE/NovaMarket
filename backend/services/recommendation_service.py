# # backend/services/recommendation_service.py - NEW FILE
# from database import db
# from models import ServiceRecommendation
# from typing import List
# import numpy as np
# from collections import defaultdict
# from datetime import datetime, timedelta

# # ============ USER PREFERENCE PROFILING ============

# async def build_user_profile(user_id: str) -> dict:
#     """Build user preference profile from booking history"""
    
#     # Get user's bookings
#     bookings = await db.bookings.find(
#         {"client_id": user_id},
#         {"_id": 0}
#     ).to_list(1000)
    
#     # Get booked services
#     service_ids = [b['service_id'] for b in bookings]
#     services = await db.listings.find(
#         {"id": {"$in": service_ids}},
#         {"_id": 0}
#     ).to_list(1000)
    
#     # Analyze preferences
#     categories = [s.get('category', '') for s in services]
#     tags = []
#     for s in services:
#         tags.extend(s.get('tags', []))
    
#     # Get price range
#     prices = [s.get('price', 0) for s in services]
#     avg_price = np.mean(prices) if prices else 0
    
#     return {
#         'favorite_categories': list(set(categories)),
#         'favorite_tags': list(set(tags)),
#         'avg_price_range': avg_price,
#         'total_bookings': len(bookings)
#     }

# # ============ COLLABORATIVE FILTERING ============

# async def get_similar_users(user_id: str, limit: int = 10) -> List[str]:
#     """Find users with similar booking patterns"""
    
#     # Get user's booked services
#     user_bookings = await db.bookings.find(
#         {"client_id": user_id},
#         {"_id": 0, "service_id": 1}
#     ).to_list(1000)
#     user_services = set([b['service_id'] for b in user_bookings])
    
#     # Get all other users' bookings
#     all_bookings = await db.bookings.find(
#         {"client_id": {"$ne": user_id}},
#         {"_id": 0, "client_id": 1, "service_id": 1}
#     ).to_list(10000)
    
#     # Calculate similarity scores
#     user_similarities = defaultdict(int)
    
#     for booking in all_bookings:
#         if booking['service_id'] in user_services:
#             user_similarities[booking['client_id']] += 1
    
#     # Sort by similarity
#     similar_users = sorted(
#         user_similarities.items(), 
#         key=lambda x: x[1], 
#         reverse=True
#     )[:limit]
    
#     return [user_id for user_id, _ in similar_users]

# # ============ PERSONALIZED RECOMMENDATIONS ============

# async def get_personalized_recommendations(
#     user_id: str, 
#     limit: int = 10
# ) -> List[ServiceRecommendation]:
#     """Get AI-powered personalized recommendations"""
    
#     # Build user profile
#     profile = await build_user_profile(user_id)
    
#     # Get services user hasn't booked
#     user_bookings = await db.bookings.find(
#         {"client_id": user_id},
#         {"_id": 0, "service_id": 1}
#     ).to_list(1000)
#     booked_service_ids = [b['service_id'] for b in user_bookings]
    
#     # Find similar users
#     similar_users = await get_similar_users(user_id)
    
#     # Get services booked by similar users
#     similar_bookings = await db.bookings.find(
#         {
#             "client_id": {"$in": similar_users},
#             "service_id": {"$nin": booked_service_ids}
#         },
#         {"_id": 0, "service_id": 1}
#     ).to_list(1000)
    
#     collaborative_service_ids = list(set([b['service_id'] for b in similar_bookings]))
    
#     # Build query for content-based filtering
#     query = {
#         "type": "service",
#         "id": {"$nin": booked_service_ids},
#         "$or": []
#     }
    
#     # Add category filter
#     if profile['favorite_categories']:
#         query["$or"].append({"category": {"$in": profile['favorite_categories']}})
    
#     # Add tag filter
#     if profile['favorite_tags']:
#         query["$or"].append({"tags": {"$in": profile['favorite_tags']}})
    
#     # Add collaborative filtering
#     if collaborative_service_ids:
#         query["$or"].append({"id": {"$in": collaborative_service_ids}})
    
#     # If no preferences, just get popular services
#     if not query["$or"]:
#         del query["$or"]
    
#     # Get candidate services
#     services = await db.listings.find(
#         query,
#         {"_id": 0}
#     ).to_list(100)
    
#     # Calculate match scores
#     recommendations = []
    
#     for service in services:
#         score = 0
#         reasons = []
        
#         # Category match
#         if service.get('category') in profile['favorite_categories']:
#             score += 30
#             reasons.append("Matches your favorite category")
        
#         # Tag match
#         matching_tags = set(service.get('tags', [])) & set(profile['favorite_tags'])
#         if matching_tags:
#             score += len(matching_tags) * 10
#             reasons.append(f"Tags: {', '.join(list(matching_tags)[:2])}")
        
#         # Collaborative filtering
#         if service['id'] in collaborative_service_ids:
#             score += 25
#             reasons.append("Popular with similar users")
        
#         # Price match
#         price_diff = abs(service.get('price', 0) - profile['avg_price_range'])
#         if price_diff < profile['avg_price_range'] * 0.3:  # Within 30%
#             score += 15
#             reasons.append("In your price range")
        
#         # Rating boost
#         if service.get('rating', 0) >= 4.5:
#             score += 20
#             reasons.append("Highly rated")
        
#         # Reviews count
#         if service.get('reviews_count', 0) >= 10:
#             score += 10
        
#         recommendations.append(
#             ServiceRecommendation(
#                 service_id=service['id'],
#                 title=service['title'],
#                 provider_name=service['seller_name'],
#                 price=service['price'],
#                 rating=service.get('rating', 0),
#                 match_score=min(score, 100),  # Cap at 100
#                 reason=reasons[0] if reasons else "Recommended for you",
#                 tags=service.get('tags', []),
#                 category=service['category'],
#                 image=service['images'][0] if service.get('images') else None
#             )
#         )
    
#     # Sort by match score
#     recommendations.sort(key=lambda x: x.match_score, reverse=True)
    
#     return recommendations[:limit]

# # ============ TRENDING SERVICES ============

# async def get_trending_services(limit: int = 10) -> List[dict]:
#     """Get trending services based on recent bookings"""
    
#     # Get bookings from last 7 days
#     week_ago = datetime.utcnow() - timedelta(days=7)
    
#     recent_bookings = await db.bookings.find(
#         {
#             "timestamp": {"$gte": week_ago.isoformat()},
#             "status": {"$ne": "cancelled"}
#         },
#         {"_id": 0, "service_id": 1}
#     ).to_list(10000)
    
#     # Count bookings per service
#     service_counts = defaultdict(int)
#     for booking in recent_bookings:
#         service_counts[booking['service_id']] += 1
    
#     # Get top services
#     top_service_ids = [
#         service_id for service_id, _ in 
#         sorted(service_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
#     ]
    
#     # Get service details
#     services = await db.listings.find(
#         {"id": {"$in": top_service_ids}},
#         {"_id": 0}
#     ).to_list(limit)
    
#     # Add booking count
#     for service in services:
#         service['trending_score'] = service_counts[service['id']]
    
#     return sorted(services, key=lambda x: x['trending_score'], reverse=True)

# # ============ SIMILAR SERVICES ============

# async def get_similar_services(service_id: str, limit: int = 6) -> List[dict]:
#     """Get similar services based on tags and category"""
    
#     # Get current service
#     service = await db.listings.find_one({"id": service_id}, {"_id": 0})
#     if not service:
#         return []
    
#     # Find similar services
#     similar = await db.listings.find(
#         {
#             "id": {"$ne": service_id},
#             "type": "service",
#             "$or": [
#                 {"category": service['category']},
#                 {"tags": {"$in": service.get('tags', [])}}
#             ]
#         },
#         {"_id": 0}
#     ).to_list(100)
    
#     # Calculate similarity scores
#     for s in similar:
#         score = 0
        
#         # Same category
#         if s['category'] == service['category']:
#             score += 50
        
#         # Matching tags
#         matching_tags = set(s.get('tags', [])) & set(service.get('tags', []))
#         score += len(matching_tags) * 15
        
#         # Price similarity
#         price_diff = abs(s['price'] - service['price'])
#         if price_diff < service['price'] * 0.3:
#             score += 20
        
#         s['similarity_score'] = score
    
#     # Sort and return top matches
#     similar.sort(key=lambda x: x['similarity_score'], reverse=True)
#     return similar[:limit]