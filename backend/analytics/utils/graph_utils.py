# graph_utils.py
import networkx as nx
import pandas as pd
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt

class GraphUtils:
    def __init__(self):
        self.graph = nx.DiGraph()
        
    def create_route_network(self, routes_df: pd.DataFrame) -> nx.DiGraph:
        """
        Create a directed graph from routes data.
        """
        G = nx.from_pandas_edgelist(
            routes_df,
            source='origin_airport',
            target='destination_airport',
            edge_attr=['distance', 'frequency', 'avg_load_factor'],
            create_using=nx.DiGraph()
        )
        self.graph = G
        return G
    
    def find_shortest_path(self, origin: str, destination: str, weight: str = 'distance') -> Tuple[List[str], float]:
        """
        Find the shortest path between two airports.
        """
        try:
            path = nx.shortest_path(self.graph, origin, destination, weight=weight)
            path_length = nx.shortest_path_length(self.graph, origin, destination, weight=weight)
            return path, path_length
        except nx.NetworkXNoPath:
            return [], float('inf')
    
    def calculate_centrality_metrics(self) -> Dict[str, Dict[str, float]]:
        """
        Calculate various centrality metrics for the network.
        """
        metrics = {
            'degree': nx.degree_centrality(self.graph),
            'betweenness': nx.betweenness_centrality(self.graph),
            'eigenvector': nx.eigenvector_centrality(self.graph, max_iter=1000),
            'pagerank': nx.pagerank(self.graph)
        }
        return metrics
    
    def find_critical_routes(self, threshold: float = 0.9) -> List[Tuple[str, str]]:
        """
        Identify critical routes based on betweenness centrality of edges.
        """
        edge_betweenness = nx.edge_betweenness_centrality(self.graph)
        critical_routes = [
            (u, v) for (u, v), centrality in edge_betweenness.items()
            if centrality > threshold
        ]
        return critical_routes
    
    def detect_communities(self) -> Dict[str, int]:
        """
        Detect communities in the route network using the Louvain method.
        """
        try:
            import community
            return community.best_partition(self.graph.to_undirected())
        except ImportError:
            print("python-louvain package not installed. Using connected components instead.")
            components = nx.connected_components(self.graph.to_undirected())
            return {node: i for i, comp in enumerate(components) for node in comp}
    
    def calculate_route_reliability(self, historical_data: pd.DataFrame) -> Dict[Tuple[str, str], float]:
        """
        Calculate route reliability based on historical performance.
        """
        reliability_scores = {}
        for edge in self.graph.edges():
            origin, destination = edge
            route_data = historical_data[
                (historical_data['origin_airport'] == origin) &
                (historical_data['destination_airport'] == destination)
            ]
            if not route_data.empty:
                on_time_rate = route_data['on_time'].mean()
                reliability_scores[edge] = on_time_rate
            
        return reliability_scores