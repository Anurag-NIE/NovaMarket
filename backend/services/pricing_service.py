# # backend/services/pricing_service.py - NEW FILE
# from database import db
# from models import PricingRule, PriceCalculation
# from datetime import datetime
# from typing import Optional

# # ============ DYNAMIC PRICING ============

# async def calculate_dynamic_price(
#     service_id: str,
#     booking_time: datetime,
#     quantity: int = 1
# ) -> PriceCalculation:
#     """Calculate dynamic price based on various factors"""
    
#     # Get service
#     service = await db.listings.find_one({"id": service_id}, {"_id": 0})
#     if not service:
#         raise ValueError("Service not found")
    
#     base_price = service['price']
    
#     # Get pricing rules
#     pricing_rule = await db.pricing_rules.find_one(
#         {"service_id": service_id},
#         {"_id": 0}
#     )
    
#     # If no custom pricing, return base price
#     if not pricing_rule:
#         return PriceCalculation(
#             base_price=base_price,
#             final_price=base_price * quantity,
#             adjustments=[],
#             discount_percentage=0,
#             savings=0
#         )
    
#     # Start with base price
#     current_price = base_price
#     adjustments = []
    
#     # 1. Surge Pricing (Peak Hours)
#     hour = booking_time.hour
#     if pricing_rule.get('enable_surge') and hour in pricing_rule.get('peak_hours', []):
#         surge_multiplier = pricing_rule.get('surge_multiplier', 1.5)
#         surge_amount = base_price * (surge_multiplier - 1)
#         current_price *= surge_multiplier
        
#         adjustments.append({
#             'type': 'surge',
#             'description': f'Peak hour pricing ({hour}:00)',
#             'amount': surge_amount,
#             'percentage': (surge_multiplier - 1) * 100
#         })
    
#     # 2. Off-Peak Discount
#     if hour in pricing_rule.get('off_peak_hours', []):
#         discount = pricing_rule.get('off_peak_discount', 0)
#         if discount > 0:
#             discount_amount = base_price * discount
#             current_price -= discount_amount
            
#             adjustments.append({
#                 'type': 'discount',
#                 'description': f'Off-peak discount',
#                 'amount': -discount_amount,
#                 'percentage': -discount * 100
#             })
    
#     # 3. Bulk Discount
#     if quantity >= 10 and pricing_rule.get('bulk_discount_10', 0) > 0:
#         discount = pricing_rule['bulk_discount_10']
#         discount_amount = current_price * discount
#         current_price -= discount_amount
        
#         adjustments.append({
#             'type': 'bulk_discount',
#             'description': f'Bulk discount (10+ bookings)',
#             'amount': -discount_amount,
#             'percentage': -discount * 100
#         })
    
#     elif quantity >= 5 and pricing_rule.get('bulk_discount_5', 0) > 0:
#         discount = pricing_rule['bulk_discount_5']
#         discount_amount = current_price * discount
#         current_price -= discount_amount
        
#         adjustments.append({
#             'type': 'bulk_discount',
#             'description': f'Bulk discount (5+ bookings)',
#             'amount': -discount_amount,
#             'percentage': -discount * 100
#         })
    
#     # Calculate total
#     final_price = current_price * quantity
#     savings = (base_price * quantity) - final_price
#     discount_percentage = (savings / (base_price * quantity) * 100) if base_price > 0 else 0
    
#     return PriceCalculation(
#         base_price=base_price,
#         final_price=final_price,
#         adjustments=adjustments,
#         discount_percentage=discount_percentage,
#         savings=max(savings, 0)
#     )

# # ============ PRICING RULES MANAGEMENT ============

# async def create_pricing_rule(rule: PricingRule) -> PricingRule:
#     """Create or update pricing rules for a service"""
    
#     rule_dict = rule.model_dump()
#     rule_dict['timestamp'] = rule_dict.pop('created_at').isoformat()
    
#     # Upsert
#     await db.pricing_rules.update_one(
#         {
#             "service_id": rule.service_id,
#             "provider_id": rule.provider_id
#         },
#         {"$set": rule_dict},
#         upsert=True
#     )
    
#     return rule

# async def get_pricing_rule(service_id: str) -> Optional[PricingRule]:
#     """Get pricing rules for a service"""
    
#     rule = await db.pricing_rules.find_one(
#         {"service_id": service_id},
#         {"_id": 0}
#     )
    
#     if not rule:
#         return None
    
#     if isinstance(rule.get('timestamp'), str):
#         rule['created_at'] = datetime.fromisoformat(rule.pop('timestamp'))
    
#     return PricingRule(**rule)

# # ============ PACKAGE DEALS ============

# async def create_package_deal(
#     provider_id: str,
#     service_ids: list,
#     package_name: str,
#     package_price: float,
#     description: str
# ) -> dict:
#     """Create a package deal combining multiple services"""
    
#     # Get services
#     services = await db.listings.find(
#         {
#             "id": {"$in": service_ids},
#             "seller_id": provider_id
#         },
#         {"_id": 0}
#     ).to_list(len(service_ids))
    
#     if len(services) != len(service_ids):
#         raise ValueError("Some services not found")
    
#     # Calculate total regular price
#     total_regular = sum(s['price'] for s in services)
#     savings = total_regular - package_price
#     discount_percentage = (savings / total_regular * 100) if total_regular > 0 else 0
    
#     package = {
#         'id': str(datetime.utcnow().timestamp()),
#         'provider_id': provider_id,
#         'name': package_name,
#         'description': description,
#         'service_ids': service_ids,
#         'services': [{'id': s['id'], 'title': s['title'], 'price': s['price']} for s in services],
#         'regular_price': total_regular,
#         'package_price': package_price,
#         'savings': savings,
#         'discount_percentage': discount_percentage,
#         'created_at': datetime.utcnow().isoformat()
#     }
    
#     await db.package_deals.insert_one(package)
    
#     return package

# async def get_provider_packages(provider_id: str) -> list:
#     """Get all package deals for a provider"""
    
#     packages = await db.package_deals.find(
#         {"provider_id": provider_id},
#         {"_id": 0}
#     ).to_list(100)
    
#     return packages

# # ============ DEMAND-BASED PRICING ============

# async def suggest_optimal_pricing(service_id: str) -> dict:
#     """Suggest optimal pricing based on demand and competition"""
    
#     # Get service
#     service = await db.listings.find_one({"id": service_id}, {"_id": 0})
#     if not service:
#         raise ValueError("Service not found")
    
#     current_price = service['price']
    
#     # Get similar services (same category)
#     similar_services = await db.listings.find(
#         {
#             "category": service['category'],
#             "type": "service",
#             "id": {"$ne": service_id}
#         },
#         {"_id": 0, "price": 1, "rating": 1}
#     ).to_list(100)
    
#     if not similar_services:
#         return {
#             'current_price': current_price,
#             'suggested_price': current_price,
#             'reason': 'No competition data available'
#         }
    
#     # Calculate market stats
#     prices = [s['price'] for s in similar_services]
#     avg_market_price = sum(prices) / len(prices)
#     min_price = min(prices)
#     max_price = max(prices)
    
#     # Get booking stats (last 30 days)
#     from datetime import timedelta
#     thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
#     bookings = await db.bookings.find(
#         {
#             "service_id": service_id,
#             "timestamp": {"$gte": thirty_days_ago.isoformat()},
#             "status": {"$ne": "cancelled"}
#         },
#         {"_id": 0}
#     ).to_list(1000)
    
#     booking_count = len(bookings)
    
#     # Determine suggestion
#     suggestion = {}
    
#     # High demand, increase price
#     if booking_count > 20:  # More than 20 bookings/month
#         if current_price < avg_market_price:
#             suggested = min(current_price * 1.15, avg_market_price)
#             suggestion = {
#                 'current_price': current_price,
#                 'suggested_price': round(suggested, 2),
#                 'reason': 'High demand detected. You can increase prices.',
#                 'potential_revenue_increase': f'{((suggested - current_price) / current_price * 100):.1f}%'
#             }
#         else:
#             suggestion = {
#                 'current_price': current_price,
#                 'suggested_price': current_price,
#                 'reason': 'Your pricing is optimal for current demand.'
#             }
    
#     # Low demand, consider discount
#     elif booking_count < 5:
#         if current_price > avg_market_price:
#             suggested = max(current_price * 0.9, avg_market_price)
#             suggestion = {
#                 'current_price': current_price,
#                 'suggested_price': round(suggested, 2),
#                 'reason': 'Low demand. Consider reducing price to attract more clients.',
#                 'price_reduction': f'{((current_price - suggested) / current_price * 100):.1f}%'
#             }
#         else:
#             suggestion = {
#                 'current_price': current_price,
#                 'suggested_price': current_price,
#                 'reason': 'Price is competitive. Focus on marketing and service quality.'
#             }
    
#     # Moderate demand
#     else:
#         suggestion = {
#             'current_price': current_price,
#             'suggested_price': current_price,
#             'reason': 'Your pricing is balanced with market rates.'
#         }
    
#     # Add market context
#     suggestion['market_data'] = {
#         'average_price': round(avg_market_price, 2),
#         'min_price': round(min_price, 2),
#         'max_price': round(max_price, 2),
#         'your_position': 'below' if current_price < avg_market_price else 'above' if current_price > avg_market_price else 'at market rate'
#     }
    
#     return suggestion