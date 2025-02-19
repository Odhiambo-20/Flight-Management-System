# backend/analytics/api/analytics_routes.py

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from ..components.route_optimizer import RouteOptimizer
from ..components.map_visualizer import MapVisualizer
from ..components.ml_models import MLModels
from ..components.dashboard_generator import DashboardGenerator

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
ml_models = MLModels()
dashboard_generator = DashboardGenerator()
route_optimizer = RouteOptimizer()

@router.get("/route-optimization/{origin}/{destination}")
async def get_optimal_route(
    origin: str, 
    destination: str, 
    criteria: Optional[str] = "distance"
):
    """Get optimal route between two airports"""
    route = route_optimizer.find_optimal_route(origin, destination, criteria)
    if not route:
        raise HTTPException(status_code=404, detail="No route found")
    return route

@router.get("/route-alternatives/{origin}/{destination}")
async def get_alternative_routes(
    origin: str, 
    destination: str, 
    max_routes: int = 3
):
    """Get alternative routes between airports"""
    routes = route_optimizer.find_alternative_routes(origin, destination, max_routes)
    return routes

@router.get("/predictions/passengers")
async def predict_passengers(days_ahead: int = 30):
    """Get passenger predictions"""
    predictions = ml_models.predict_passengers(days_ahead)
    return {
        "predictions": predictions.tolist(),
        "dates": [(datetime.now() + timedelta(days=i)).isoformat() 
                 for i in range(days_ahead)]
    }

@router.get("/predictions/revenue")
async def predict_revenue(days_ahead: int = 30):
    """Get revenue predictions"""
    predictions = ml_models.predict_revenue(days_ahead)
    return {
        "predictions": predictions.tolist(),
        "dates": [(datetime.now() + timedelta(days=i)).isoformat() 
                 for i in range(days_ahead)]
    }

@router.get("/dashboard/booking-trends")
async def get_booking_trends():
    """Get booking trends visualization data"""
    return dashboard_generator.generate_booking_trends()

@router.get("/dashboard/revenue-analysis")
async def get_revenue_analysis():
    """Get revenue analysis visualization data"""
    return dashboard_generator.generate_revenue_analysis()

@router.get("/dashboard/route-performance")
async def get_route_performance():
    """Get route performance visualization data"""
    return dashboard_generator.generate_route_performance()

@router.get("/dashboard/payment-distribution")
async def get_payment_distribution():
    """Get payment method distribution data"""
    return dashboard_generator.generate_payment_distribution()

@router.get("/dashboard/hotel-preferences")
async def get_hotel_preferences():
    """Get hotel booking preferences data"""
    return dashboard_generator.generate_hotel_preferences()