import pandas as pd
import numpy as np
import networkx as nx
import folium
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import tensorflow as tf
from tensorflow import keras
import json
import warnings
warnings.filterwarnings('ignore')

class FlightAnalyticsSystem:
    def __init__(self):
        self.graph = nx.Graph()
        self.flight_data = None
        self.booking_data = None
        self.hotel_data = None
        self.passenger_predictor = None
        self.revenue_predictor = None
        
    def load_data(self, flight_data_path, booking_data_path, hotel_data_path):
        """Load and preprocess all necessary data"""
        self.flight_data = pd.read_csv(flight_data_path)
        self.booking_data = pd.read_csv(booking_data_path)
        self.hotel_data = pd.read_csv(hotel_data_path)
        
        # Create network graph from airports and routes
        for _, flight in self.flight_data.iterrows():
            self.graph.add_edge(
                flight['origin_airport'],
                flight['destination_airport'],
                weight=flight['distance'],
                cost=flight['base_cost']
            )

    def visualize_route_network(self):
        """Create an interactive world map with flight routes"""
        world_map = folium.Map(location=[0, 0], zoom_start=2)
        
        # Add airports as markers
        for airport in self.flight_data['origin_airport'].unique():
            coords = self.get_airport_coordinates(airport)
            folium.CircleMarker(
                location=coords,
                radius=5,
                color='red',
                fill=True
            ).add_to(world_map)
            
        # Add flight routes as lines
        for _, flight in self.flight_data.iterrows():
            origin_coords = self.get_airport_coordinates(flight['origin_airport'])
            dest_coords = self.get_airport_coordinates(flight['destination_airport'])
            folium.PolyLine(
                locations=[origin_coords, dest_coords],
                weight=2,
                color='blue',
                opacity=0.6
            ).add_to(world_map)
            
        return world_map

    def find_optimal_route(self, origin, destination):
        """Calculate optimal route using Dijkstra's algorithm"""
        try:
            path = nx.shortest_path(
                self.graph, 
                origin, 
                destination, 
                weight='weight'
            )
            total_distance = nx.shortest_path_length(
                self.graph, 
                origin, 
                destination, 
                weight='weight'
            )
            total_cost = sum(self.graph[path[i]][path[i+1]]['cost'] 
                           for i in range(len(path)-1))
            
            return {
                'path': path,
                'total_distance': total_distance,
                'total_cost': total_cost
            }
        except nx.NetworkXNoPath:
            return None

    def train_prediction_models(self):
        """Train ML models for passenger and revenue prediction"""
        # Prepare features for passenger prediction
        X_passengers = self.prepare_prediction_features(self.booking_data)
        y_passengers = self.booking_data['passenger_count']
        
        # Train passenger prediction model
        self.passenger_predictor = RandomForestRegressor(n_estimators=100)
        self.passenger_predictor.fit(X_passengers, y_passengers)
        
        # Prepare features for revenue prediction
        X_revenue = self.prepare_prediction_features(self.booking_data)
        y_revenue = self.booking_data['total_revenue']
        
        # Train revenue prediction model
        self.revenue_predictor = RandomForestRegressor(n_estimators=100)
        self.revenue_predictor.fit(X_revenue, y_revenue)

    def predict_future_metrics(self, days_ahead=30):
        """Predict future passengers and revenue"""
        future_dates = pd.date_range(
            start=datetime.now(),
            periods=days_ahead
        )
        
        predictions = []
        for date in future_dates:
            features = self.prepare_prediction_features(
                pd.DataFrame({'date': [date]})
            )
            
            passenger_pred = self.passenger_predictor.predict(features)[0]
            revenue_pred = self.revenue_predictor.predict(features)[0]
            
            predictions.append({
                'date': date,
                'predicted_passengers': passenger_pred,
                'predicted_revenue': revenue_pred
            })
            
        return pd.DataFrame(predictions)

    def generate_analytics_dashboard(self):
        """Generate real-time analytics dashboard"""
        # Payment method analysis
        payment_dist = px.pie(
            self.booking_data,
            names='payment_method',
            title='Payment Method Distribution'
        )
        
        # Passenger trends
        passenger_trend = px.line(
            self.booking_data.groupby('booking_date')['passenger_count'].sum().reset_index(),
            x='booking_date',
            y='passenger_count',
            title='Daily Passenger Trends'
        )
        
        # Hotel booking analysis
        hotel_preference = px.bar(
            self.hotel_data.groupby('hotel_name')['bookings'].sum().reset_index(),
            x='hotel_name',
            y='bookings',
            title='Popular Hotels'
        )
        
        # Profit/Loss analysis
        financial_analysis = px.line(
            self.booking_data.groupby('booking_date')['profit_loss'].sum().reset_index(),
            x='booking_date',
            y='profit_loss',
            title='Daily Profit/Loss Trends'
        )
        
        return {
            'payment_distribution': payment_dist,
            'passenger_trends': passenger_trend,
            'hotel_preferences': hotel_preference,
            'financial_analysis': financial_analysis
        }

    def analyze_route_profitability(self):
        """Analyze profitability of different routes"""
        route_stats = self.booking_data.groupby(
            ['origin_airport', 'destination_airport']
        ).agg({
            'total_revenue': 'sum',
            'total_cost': 'sum',
            'passenger_count': 'sum'
        }).reset_index()
        
        route_stats['profit'] = route_stats['total_revenue'] - route_stats['total_cost']
        route_stats['profit_per_passenger'] = (
            route_stats['profit'] / route_stats['passenger_count']
        )
        
        return route_stats

    def detect_anomalies(self):
        """Detect anomalies in booking patterns using Isolation Forest"""
        iso_forest = IsolationForest(contamination=0.1)
        
        features = self.booking_data[[
            'passenger_count', 
            'total_revenue', 
            'total_cost'
        ]]
        
        anomalies = iso_forest.fit_predict(features)
        return pd.DataFrame({
            'date': self.booking_data['booking_date'],
            'is_anomaly': anomalies == -1
        })

    def optimize_pricing(self):
        """Optimize ticket pricing using machine learning"""
        features = self.prepare_prediction_features(self.booking_data)
        target = self.booking_data['ticket_price']
        
        model = keras.Sequential([
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mse')
        model.fit(features, target, epochs=50, batch_size=32, verbose=0)
        
        return model

    def prepare_prediction_features(self, data):
        """Prepare features for ML models"""
        # Convert dates to useful features
        data['day_of_week'] = pd.to_datetime(data['date']).dt.dayofweek
        data['month'] = pd.to_datetime(data['date']).dt.month
        data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)
        
        # Select and scale features
        features = data[[
            'day_of_week',
            'month',
            'is_weekend'
        ]]
        
        scaler = StandardScaler()
        return scaler.fit_transform(features)

    def get_airport_coordinates(self, airport_code):
        """Get airport coordinates from database"""
        # This would typically query a database of airport coordinates
        # For now, return dummy coordinates
        return [0, 0]

    def generate_api_response(self):
        """Generate JSON response for admin dashboard"""
        predictions = self.predict_future_metrics()
        route_analysis = self.analyze_route_profitability()
        dashboard = self.generate_analytics_dashboard()
        
        return {
            'predictions': predictions.to_dict(orient='records'),
            'route_analysis': route_analysis.to_dict(orient='records'),
            'dashboard_data': {
                'payment_methods': dashboard['payment_distribution'],
                'passenger_trends': dashboard['passenger_trends'],
                'hotel_preferences': dashboard['hotel_preferences'],
                'financial_analysis': dashboard['financial_analysis']
            }
        }

# Usage example
if __name__ == "__main__":
    analytics_system = FlightAnalyticsSystem()
    analytics_system.load_data(
        'flight_data.csv',
        'booking_data.csv',
        'hotel_data.csv'
    )
    
    # Train prediction models
    analytics_system.train_prediction_models()
    
    # Generate world map
    route_map = analytics_system.visualize_route_network()
    
    # Find optimal route
    optimal_route = analytics_system.find_optimal_route(
        'JFK',
        'LHR'
    )
    
    # Generate analytics
    dashboard_data = analytics_system.generate_api_response()