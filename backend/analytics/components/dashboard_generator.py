# backend/analytics/components/dashboard_generator.py

import plotly.express as px
import plotly.graph_objects as go
from typing import Dict, List
import pandas as pd
import json

class DashboardGenerator:
    def __init__(self):
        self.theme = 'plotly'
        self.color_scheme = px.colors.qualitative.Set3

    def generate_booking_trends(self, data: pd.DataFrame) -> Dict:
        """Generate booking trends visualization"""
        daily_bookings = data.groupby('booking_date')['passenger_count'].sum().reset_index()
        
        fig = px.line(
            daily_bookings,
            x='booking_date',
            y='passenger_count',
            title='Daily Booking Trends'
        )
        
        return json.loads(fig.to_json())

    def generate_revenue_analysis(self, data: pd.DataFrame) -> Dict:
        """Generate revenue analysis visualization"""
        revenue_data = data.groupby('booking_date')['total_revenue'].sum().reset_index()
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=revenue_data['booking_date'],
            y=revenue_data['total_revenue'],
            mode='lines+markers',
            name='Daily Revenue'
        ))
        
        # Add trend line
        fig.add_trace(go.Scatter(
            x=revenue_data['booking_date'],
            y=revenue_data['total_revenue'].rolling(7).mean(),
            mode='lines',
            name='7-day Moving Average',
            line=dict(dash='dash')
        ))
        
        fig.update_layout(title='Revenue Analysis')
        return json.loads(fig.to_json())

    def generate_route_performance(self, data: pd.DataFrame) -> Dict:
        """Generate route performance visualization"""
        route_perf = data.groupby(['origin', 'destination']).agg({
            'passenger_count': 'sum',
            'total_revenue': 'sum'
        }).reset_index()
        
        fig = px.scatter(
            route_perf,
            x='passenger_count',
            y='total_revenue',
            text='origin',
            title='Route Performance Analysis'
        )
        
        return json.loads(fig.to_json())

    def generate_payment_distribution(self, data: pd.DataFrame) -> Dict:
        """Generate payment method distribution visualization"""
        payment_dist = data['payment_method'].value_counts()
        
        fig = px.pie(
            values=payment_dist.values,
            names=payment_dist.index,
            title='Payment Method Distribution'
        )
        
        return json.loads(fig.to_json())

    def generate_hotel_preferences(self, data: pd.DataFrame) -> Dict:
        """Generate hotel booking preferences visualization"""
        hotel_bookings = data.groupby('hotel_name')['booking_count'].sum().reset_index()
        
        fig = px.bar(
            hotel_bookings,
            x='hotel_name',
            y='booking_count',
            title='Popular Hotels'
        )
        
        return json.loads(fig.to_json())

    def generate_forecast_visualization(
        self, 
        dates: List, 
        predictions: Dict
    ) -> Dict:
        """Generate forecast visualization"""
        fig = go.Figure()
        
        # Passenger forecast
        fig.add_trace(go.Scatter(
            x=dates,
            y=predictions['passenger_forecast'],
            mode='lines',
            name='Passenger Forecast'
        ))