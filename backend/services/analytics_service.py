# # backend/services/analytics_service.py - NEW FILE
# from database import db
# from datetime import datetime, timedelta
# from typing import List, Dict, Any
# import numpy as np
# from collections import defaultdict

# # ============ PROVIDER ANALYTICS ============

# async def get_provider_analytics(provider_id: str, days: int = 30) -> Dict[str, Any]:
#     """Get comprehensive analytics for provider"""
    
#     start_date = datetime.utcnow() - timedelta(days=days)
    
#     # Get bookings
#     bookings = await db.bookings.find(
#         {
#             "provider_id": provider_id,
#             "timestamp": {"$gte": start_date.isoformat()}
#         },
#         {"_id": 0}
#     ).to_list(10000)
    
#     # Get services
#     services = await db.listings.find(
#         {"seller_id": provider_id, "type": "service"},
#         {"_id": 0}
#     ).to_list(1000)
    
#     # Calculate metrics
#     total_bookings = len(bookings)
#     completed_bookings = len([b for b in bookings if b['status'] == 'completed'])
#     cancelled_bookings = len([b for b in bookings if b['status'] == 'cancelled'])
    
#     # Revenue
#     total_revenue = sum(b['price'] for b in bookings if b['status'] != 'cancelled')
#     avg_booking_value = total_revenue / total_bookings if total_bookings > 0 else 0
    
#     # Daily breakdown
#     daily_data = defaultdict(lambda: {'bookings': 0, 'revenue': 0})
    
#     for booking in bookings:
#         if booking['status'] == 'cancelled':
#             continue
        
#         date = datetime.fromisoformat(booking['timestamp']).date()
#         daily_data[date.isoformat()]['bookings'] += 1
#         daily_data[date.isoformat()]['revenue'] += booking['price']
    
#     # Sort by date
#     daily_stats = [
#         {'date': date, **stats}
#         for date, stats in sorted(daily_data.items())
#     ]
    
#     # Service performance
#     service_stats = []
#     for service in services:
#         service_bookings = [b for b in bookings if b['service_id'] == service['id']]
        
#         service_stats.append({
#             'service_id': service['id'],
#             'title': service['title'],
#             'total_bookings': len(service_bookings),
#             'revenue': sum(b['price'] for b in service_bookings if b['status'] != 'cancelled'),
#             'avg_rating': service.get('rating', 0),
#             'reviews_count': service.get('reviews_count', 0)
#         })
    
#     # Sort by revenue
#     service_stats.sort(key=lambda x: x['revenue'], reverse=True)
    
#     # Growth trends
#     current_period = bookings
#     previous_start = start_date - timedelta(days=days)
    
#     previous_bookings = await db.bookings.find(
#         {
#             "provider_id": provider_id,
#             "timestamp": {
#                 "$gte": previous_start.isoformat(),
#                 "$lt": start_date.isoformat()
#             }
#         },
#         {"_id": 0}
#     ).to_list(10000)
    
#     prev_revenue = sum(b['price'] for b in previous_bookings if b['status'] != 'cancelled')
    
#     revenue_growth = 0
#     if prev_revenue > 0:
#         revenue_growth = ((total_revenue - prev_revenue) / prev_revenue) * 100
    
#     booking_growth = 0
#     if len(previous_bookings) > 0:
#         booking_growth = ((total_bookings - len(previous_bookings)) / len(previous_bookings)) * 100
    
#     # Peak hours analysis
#     hourly_bookings = defaultdict(int)
#     for booking in bookings:
#         hour = datetime.fromisoformat(booking['start_time']).hour
#         hourly_bookings[hour] += 1
    
#     peak_hours = sorted(hourly_bookings.items(), key=lambda x: x[1], reverse=True)[:3]
    
#     return {
#         'summary': {
#             'total_bookings': total_bookings,
#             'completed_bookings': completed_bookings,
#             'cancelled_bookings': cancelled_bookings,
#             'cancellation_rate': (cancelled_bookings / total_bookings * 100) if total_bookings > 0 else 0,
#             'total_revenue': total_revenue,
#             'avg_booking_value': avg_booking_value,
#             'revenue_growth': revenue_growth,
#             'booking_growth': booking_growth
#         },
#         'daily_stats': daily_stats,
#         'service_performance': service_stats,
#         'peak_hours': [{'hour': h, 'bookings': c} for h, c in peak_hours],
#         'total_services': len(services)
#     }

# # ============ CLIENT INSIGHTS ============

# async def get_client_insights(provider_id: str) -> Dict[str, Any]:
#     """Get insights about clients"""
    
#     bookings = await db.bookings.find(
#         {"provider_id": provider_id},
#         {"_id": 0}
#     ).to_list(10000)
    
#     # Client frequency
#     client_bookings = defaultdict(int)
#     for booking in bookings:
#         client_bookings[booking['client_id']] += 1
    
#     # Categorize clients
#     new_clients = sum(1 for count in client_bookings.values() if count == 1)
#     repeat_clients = sum(1 for count in client_bookings.values() if count > 1)
#     vip_clients = sum(1 for count in client_bookings.values() if count >= 5)
    
#     # Top clients
#     top_clients = sorted(client_bookings.items(), key=lambda x: x[1], reverse=True)[:10]
    
#     top_client_details = []
#     for client_id, booking_count in top_clients:
#         client = await db.users.find_one({"id": client_id}, {"_id": 0})
#         if client:
#             client_total = sum(
#                 b['price'] for b in bookings 
#                 if b['client_id'] == client_id and b['status'] != 'cancelled'
#             )
            
#             top_client_details.append({
#                 'client_id': client_id,
#                 'name': client['name'],
#                 'email': client['email'],
#                 'total_bookings': booking_count,
#                 'total_spent': client_total
#             })
    
#     # Client retention rate
#     total_clients = len(client_bookings)
#     retention_rate = (repeat_clients / total_clients * 100) if total_clients > 0 else 0
    
#     return {
#         'total_clients': total_clients,
#         'new_clients': new_clients,
#         'repeat_clients': repeat_clients,
#         'vip_clients': vip_clients,
#         'retention_rate': retention_rate,
#         'top_clients': top_client_details
#     }

# # ============ PREDICTIVE ANALYTICS ============

# async def predict_demand(provider_id: str, days_ahead: int = 7) -> List[Dict[str, Any]]:
#     """Predict booking demand for next N days"""
    
#     # Get historical data (last 30 days)
#     start_date = datetime.utcnow() - timedelta(days=30)
    
#     bookings = await db.bookings.find(
#         {
#             "provider_id": provider_id,
#             "timestamp": {"$gte": start_date.isoformat()}
#         },
#         {"_id": 0}
#     ).to_list(10000)
    
#     # Analyze by day of week
#     weekday_bookings = defaultdict(list)
    
#     for booking in bookings:
#         date = datetime.fromisoformat(booking['start_time'])
#         weekday = date.weekday()
#         weekday_bookings[weekday].append(booking)
    
#     # Calculate averages
#     weekday_avg = {}
#     for weekday in range(7):
#         bookings_list = weekday_bookings[weekday]
#         if bookings_list:
#             weekday_avg[weekday] = len(bookings_list) / 4  # ~4 weeks
#         else:
#             weekday_avg[weekday] = 0
    
#     # Predict next N days
#     predictions = []
#     current_date = datetime.utcnow()
    
#     for i in range(days_ahead):
#         future_date = current_date + timedelta(days=i)
#         weekday = future_date.weekday()
        
#         predictions.append({
#             'date': future_date.date().isoformat(),
#             'day_name': future_date.strftime('%A'),
#             'predicted_bookings': round(weekday_avg.get(weekday, 0)),
#             'confidence': 'medium' if weekday_avg.get(weekday, 0) > 0 else 'low'
#         })
    
#     return predictions

# # ============ RECOMMENDATIONS FOR PROVIDER ============

# async def get_provider_recommendations(provider_id: str) -> List[Dict[str, str]]:
#     """AI-powered recommendations for improving business"""
    
#     analytics = await get_provider_analytics(provider_id)
#     recommendations = []
    
#     # Low booking rate
#     if analytics['summary']['total_bookings'] < 5:
#         recommendations.append({
#             'title': 'Increase Visibility',
#             'description': 'Your booking rate is low. Consider adding more images, improving descriptions, and offering promotional discounts.',
#             'priority': 'high'
#         })
    
#     # High cancellation rate
#     if analytics['summary']['cancellation_rate'] > 20:
#         recommendations.append({
#             'title': 'Reduce Cancellations',
#             'description': f"Your cancellation rate is {analytics['summary']['cancellation_rate']:.1f}%. Review your booking policies and improve communication with clients.",
#             'priority': 'high'
#         })
    
#     # Pricing optimization
#     avg_value = analytics['summary']['avg_booking_value']
#     if avg_value > 0:
#         recommendations.append({
#             'title': 'Optimize Pricing',
#             'description': f'Your average booking value is ${avg_value:.2f}. Consider creating package deals to increase value.',
#             'priority': 'medium'
#         })
    
#     # Peak hours
#     if analytics['peak_hours']:
#         peak_hour = analytics['peak_hours'][0]['hour']
#         recommendations.append({
#             'title': 'Leverage Peak Hours',
#             'description': f'Your busiest time is around {peak_hour}:00. Consider surge pricing during peak hours.',
#             'priority': 'medium'
#         })
    
#     # Service performance
#     if analytics['service_performance']:
#         top_service = analytics['service_performance'][0]
#         recommendations.append({
#             'title': 'Promote Top Service',
#             'description': f'"{top_service["title"]}" is your best performer. Focus marketing on similar services.',
#             'priority': 'low'
#         })
    
#     return recommendations