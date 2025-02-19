# backend/analytics/components/ml_models.py

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from tensorflow import keras
from typing import Dict, Tuple, List
import joblib

class MLModels:
    def __init__(self):
        self.passenger_predictor = None
        self.revenue_predictor = None
        self.anomaly_detector = None
        self.price_optimizer = None
        self.scaler = StandardScaler()

    def train_passenger_predictor(self, data: pd.DataFrame):
        """Train passenger prediction model"""
        X = self._prepare_features(data)
        y = data['passenger_count']
        
        self.passenger_predictor = RandomForestRegressor(
            n_estimators=100,
            random_state=42
        )
        self.passenger_predictor.fit(X, y)

    def train_revenue_predictor(self, data: pd.DataFrame):
        """Train revenue prediction model"""
        X = self._prepare_features(data)
        y = data['total_revenue']
        
        self.revenue_predictor = RandomForestRegressor(
            n_estimators=100,
            random_state=42
        )
        self.revenue_predictor.fit(X, y)

    def train_anomaly_detector(self, data: pd.DataFrame):
        """Train anomaly detection model"""
        features = data[[
            'passenger_count',
            'total_revenue',
            'booking_rate'
        ]]
        
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42
        )
        self.anomaly_detector.fit(features)

    def train_price_optimizer(self, data: pd.DataFrame):
        """Train price optimization model"""
        X = self._prepare_features(data)
        y = data['optimal_price']
        
        self.price_optimizer = keras.Sequential([
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(1)
        ])
        
        self.price_optimizer.compile(optimizer='adam', loss='mse')
        self.price_optimizer.fit(X, y, epochs=50, batch_size=32, verbose=0)

    def predict_passengers(self, features: pd.DataFrame) -> np.ndarray:
        """Predict passenger numbers"""
        X = self._prepare_features(features)
        return self.passenger_predictor.predict(X)

    def predict_revenue(self, features: pd.DataFrame) -> np.ndarray:
        """Predict revenue"""
        X = self._prepare_features(features)
        return self.revenue_predictor.predict(X)

    def detect_anomalies(self, data: pd.DataFrame) -> np.ndarray:
        """Detect booking anomalies"""
        features = data[[
            'passenger_count',
            'total_revenue',
            'booking_rate'
        ]]
        return self.anomaly_detector.predict(features)

    def optimize_price(self, features: pd.DataFrame) -> np.ndarray:
        """Optimize ticket pricing"""
        X = self._prepare_features(features)
        return self.price_optimizer.predict(X)

    def _prepare_features(self, data: pd.DataFrame) -> np.ndarray:
        """Prepare features for ML models"""
        features = data.copy()
        
        # Convert dates to cyclical features
        if 'date' in features.columns:
            features['day_sin'] = np.sin(2 * np.pi * features['date'].dt.day / 31)
            features['day_cos'] = np.cos(2 * np.pi * features['date'].dt.day / 31)
            features['month_sin'] = np.sin(2 * np.pi * features['date'].dt.month / 12)
            features['month_cos'] = np.cos(2 * np.pi * features['date'].dt.month / 12)
            features.drop('date', axis=1, inplace=True)

        # Scale features
        return self.scaler.fit_transform(features)

    def save_models(self, path: str):
        """Save trained models"""
        joblib.dump(self.passenger_predictor, f"{path}/passenger_model.pkl")
        joblib.dump(self.revenue_predictor, f"{path}/revenue_model.pkl")
        joblib.dump(self.anomaly_detector, f"{path}/anomaly_model.pkl")
        self.price_optimizer.save(f"{path}/price_optimizer")

    def load_models(self, path: str):
        """Load trained models"""
        self.passenger_predictor = joblib.load(f"{path}/passenger_model.pkl")
        self.revenue_predictor = joblib.load(f"{path}/revenue_model.pkl")
        self.anomaly_detector = joblib.load(f"{path}/anomaly_model.pkl")
        self.price_optimizer = keras.models.load_model(f"{path}/price_optimizer")