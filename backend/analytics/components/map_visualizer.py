# backend/analytics/components/map_visualizer.py

import folium
from typing import Dict, List, Tuple
import pandas as pd
from branca.colormap import LinearColormap

class MapVisualizer:
    def __init__(self):
        self.base_map = None
        self.route_colors = LinearColormap(
            colors=['green', 'yellow', 'red'],
            vmin=0,
            vmax=1000
        )

    def create_base_map(self) -> folium.Map:
        """Create base world map"""
        self.base_map = folium.Map(
            location=[0, 0],
            zoom_start=2,
            tiles='OpenStreetMap'
        )
        return self.base_map

    def add_airports(self, airports_data: pd.DataFrame):
        """Add airports to the map"""
        for _, airport in airports_data.iterrows():
            folium.CircleMarker(
                location=[airport['latitude'], airport['longitude']],
                radius=5,
                popup=f"{airport['name']} ({airport['code']})",
                color='red',
                fill=True
            ).add_to(self.base_map)

    def visualize_route(
        self, 
        route: List[str], 
        airports_data: Dict, 
        route_info: Dict = None
    ):
        """Visualize specific route on the map"""
        coordinates = []
        for airport_code in route:
            airport = airports_data[airport_code]
            coordinates.append([airport['latitude'], airport['longitude']])

        # Draw route line
        folium.PolyLine(
            locations=coordinates,
            weight=2,
            color='blue',
            opacity=0.8,
            popup=self._create_route_popup(route_info) if route_info else None
        ).add_to(self.base_map)

    def visualize_traffic_density(self, routes_data: pd.DataFrame):
        """Visualize route traffic density"""
        for _, route in routes_data.iterrows():
            color = self.route_colors(route['traffic_density'])
            
            folium.PolyLine(
                locations=[
                    [route['origin_lat'], route['origin_lon']],
                    [route['dest_lat'], route['dest_lon']]
                ],
                weight=2,
                color=color,
                opacity=0.6
            ).add_to(self.base_map)

    def _create_route_popup(self, route_info: Dict) -> str:
        """Create popup HTML for route information"""
        return f"""
            <div style='font-family: Arial; font-size: 12px;'>
                <b>Distance:</b> {route_info['total_distance']:.0f} km<br>
                <b>Cost:</b> ${route_info['total_cost']:.2f}<br>
                <b>Stops:</b> {route_info['stops']}<br>
                <b>Est. Time:</b> {route_info['estimated_time']:.1f} hours
            </div>
        """

    def save_map(self, filename: str):
        """Save map to HTML file"""
        self.base_map.save(filename)