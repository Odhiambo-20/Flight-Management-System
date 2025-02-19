# geo_utils.py
from typing import Tuple, List, Dict
import numpy as np
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import folium

class GeoUtils:
    def __init__(self):
        self.geocoder = Nominatim(user_agent="flight_analytics")
        
    def calculate_distance(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> float:
        """
        Calculate the great-circle distance between two points in kilometers.
        """
        return geodesic(origin, destination).kilometers
    
    def get_coordinates(self, airport_code: str) -> Tuple[float, float]:
        """
        Get the coordinates (latitude, longitude) for an airport using its code.
        """
        try:
            location = self.geocoder.geocode(f"{airport_code} airport")
            return (location.latitude, location.longitude)
        except:
            return None
    
    def calculate_flight_path(self, origin: Tuple[float, float], destination: Tuple[float, float], 
                            points: int = 100) -> List[Tuple[float, float]]:
        """
        Calculate a great circle path between two points.
        """
        # Convert to radians
        lat1, lon1 = np.radians(origin)
        lat2, lon2 = np.radians(destination)
        
        d = geodesic(origin, destination).kilometers
        
        # Generate points along the path
        f = np.linspace(0, 1, points)
        path = []
        
        for t in f:
            # Great circle formulas
            A = np.sin((1 - t) * d) / np.sin(d)
            B = np.sin(t * d) / np.sin(d)
            x = A * np.cos(lat1) * np.cos(lon1) + B * np.cos(lat2) * np.cos(lon2)
            y = A * np.cos(lat1) * np.sin(lon1) + B * np.cos(lat2) * np.sin(lon2)
            z = A * np.sin(lat1) + B * np.sin(lat2)
            
            lat = np.arctan2(z, np.sqrt(x**2 + y**2))
            lon = np.arctan2(y, x)
            
            path.append((np.degrees(lat), np.degrees(lon)))
            
        return path
    
    def create_route_map(self, routes: List[Tuple[Tuple[float, float], Tuple[float, float]]]) -> folium.Map:
        """
        Create an interactive map showing flight routes.
        """
        # Calculate center point of all coordinates
        all_coords = [coord for route in routes for coord in route]
        center_lat = np.mean([coord[0] for coord in all_coords])
        center_lon = np.mean([coord[1] for coord in all_coords])
        
        # Create base map
        m = folium.Map(location=[center_lat, center_lon], zoom_start=4)
        
        # Add routes
        for origin, destination in routes:
            path = self.calculate_flight_path(origin, destination)
            folium.PolyLine(
                path,
                weight=2,
                color='red',
                opacity=0.8
            ).add_to(m)
            
            # Add markers for airports
            folium.CircleMarker(
                origin,
                radius=5,
                color='green',
                fill=True
            ).add_to(m)
            
            folium.CircleMarker(
                destination,
                radius=5,
                color='red',
                fill=True
            ).add_to(m)
            
        return m
    
    def calculate_timezone_impact(self, origin: Tuple[float, float], destination: Tuple[float, float],
                                departure_time: str) -> Dict[str, float]:
        """
        Calculate the impact of timezone changes on flight scheduling.
        """
        from timezonefinder import TimezoneFinder
        from datetime import datetime
        import pytz
        
        tf = TimezoneFinder()
        
        # Get timezones
        origin_tz = pytz.timezone(tf.timezone_at(lat=origin[0], lng=origin[1]))
        dest_tz = pytz.timezone(tf.timezone_at(lat=destination[0], lng=destination[1]))
        
        # Convert departure time to datetime
        departure_dt = datetime.strptime(departure_time, "%Y-%m-%d %H:%M:%S")
        origin_dt = origin_tz.localize(departure_dt)
        dest_dt = origin_dt.astimezone(dest_tz)
        
        time_diff = (dest_dt.utcoffset() - origin_dt.utcoffset()).total_seconds() / 3600
        
        return {
            'timezone_difference': time_diff,
            'origin_timezone': str(origin_tz),
            'destination_timezone': str(dest_tz),
            'local_arrival_time': str(dest_dt)
        }