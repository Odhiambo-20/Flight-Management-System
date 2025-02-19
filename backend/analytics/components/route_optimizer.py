# backend/analytics/components/route_optimizer.py

import networkx as nx
import pandas as pd
from typing import Dict, List, Optional
from ..utils.geo_utils import calculate_distance

class RouteOptimizer:
    def __init__(self):
        self.route_graph = nx.Graph()
        self.airports_data = {}

    def build_route_network(self, routes_data: pd.DataFrame, airports_data: pd.DataFrame):
        """Build network graph from routes and airports data"""
        self.airports_data = airports_data.set_index('code').to_dict('index')
        
        for _, route in routes_data.iterrows():
            distance = calculate_distance(
                self.airports_data[route['origin']]['coordinates'],
                self.airports_data[route['destination']]['coordinates']
            )
            
            self.route_graph.add_edge(
                route['origin'],
                route['destination'],
                weight=distance,
                cost=route['base_cost']
            )

    def find_optimal_route(
        self, 
        origin: str, 
        destination: str, 
        optimization_criterion: str = 'distance'
    ) -> Dict:
        """
        Find optimal route between two airports
        
        Args:
            origin: Origin airport code
            destination: Destination airport code
            optimization_criterion: 'distance' or 'cost'
        
        Returns:
            Dict containing path, distance, cost, and estimated time
        """
        try:
            path = nx.shortest_path(
                self.route_graph, 
                origin, 
                destination, 
                weight=optimization_criterion
            )
            
            total_distance = sum(
                self.route_graph[path[i]][path[i+1]]['weight'] 
                for i in range(len(path)-1)
            )
            
            total_cost = sum(
                self.route_graph[path[i]][path[i+1]]['cost'] 
                for i in range(len(path)-1)
            )
            
            estimated_time = self.calculate_flight_time(total_distance)
            
            return {
                'path': path,
                'total_distance': total_distance,
                'total_cost': total_cost,
                'estimated_time': estimated_time,
                'stops': len(path) - 2 if len(path) > 2 else 0
            }
            
        except nx.NetworkXNoPath:
            return None

    def find_alternative_routes(
        self, 
        origin: str, 
        destination: str, 
        max_alternatives: int = 3
    ) -> List[Dict]:
        """Find alternative routes between airports"""
        routes = []
        for path in nx.shortest_simple_paths(
            self.route_graph, 
            origin, 
            destination
        ):
            if len(routes) >= max_alternatives:
                break
                
            total_distance = sum(
                self.route_graph[path[i]][path[i+1]]['weight'] 
                for i in range(len(path)-1)
            )
            
            total_cost = sum(
                self.route_graph[path[i]][path[i+1]]['cost'] 
                for i in range(len(path)-1)
            )
            
            routes.append({
                'path': path,
                'total_distance': total_distance,
                'total_cost': total_cost,
                'stops': len(path) - 2
            })
            
        return routes

    def calculate_flight_time(self, distance: float) -> float:
        """Calculate estimated flight time based on distance"""
        average_speed = 800  # km/h
        return distance / average_speed