# data_preprocessor.py
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime

class DataPreprocessor:
    def __init__(self):
        self.categorical_columns: List[str] = []
        self.numerical_columns: List[str] = []
        
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean the input dataframe by handling missing values, outliers, and data type conversions.
        """
        # Create a copy to avoid modifying the original
        cleaned_df = df.copy()
        
        # Handle missing values
        cleaned_df = cleaned_df.fillna({
            'revenue': 0,
            'passenger_count': 0,
            'departure_time': cleaned_df['departure_time'].median(),
            'arrival_time': cleaned_df['arrival_time'].median()
        })
        
        # Remove duplicates
        cleaned_df = cleaned_df.drop_duplicates()
        
        # Convert datetime columns
        datetime_columns = ['departure_time', 'arrival_time', 'booking_time']
        for col in datetime_columns:
            if col in cleaned_df.columns:
                cleaned_df[col] = pd.to_datetime(cleaned_df[col])
                
        return cleaned_df
    
    def handle_outliers(self, df: pd.DataFrame, columns: List[str], method: str = 'iqr') -> pd.DataFrame:
        """
        Handle outliers in specified columns using either IQR or z-score method.
        """
        processed_df = df.copy()
        
        for column in columns:
            if method == 'iqr':
                Q1 = processed_df[column].quantile(0.25)
                Q3 = processed_df[column].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                processed_df[column] = processed_df[column].clip(lower_bound, upper_bound)
            elif method == 'zscore':
                z_scores = np.abs((processed_df[column] - processed_df[column].mean()) / processed_df[column].std())
                processed_df[column] = processed_df[column].mask(z_scores > 3, processed_df[column].mean())
                
        return processed_df
    
    def encode_categorical_features(self, df: pd.DataFrame, columns: List[str]) -> Tuple[pd.DataFrame, Dict]:
        """
        Encode categorical features using label encoding and return encoding mappings.
        """
        encoded_df = df.copy()
        encoding_maps = {}
        
        for column in columns:
            if column in encoded_df.columns:
                unique_values = encoded_df[column].unique()
                encoding_map = {val: idx for idx, val in enumerate(unique_values)}
                encoded_df[column] = encoded_df[column].map(encoding_map)
                encoding_maps[column] = encoding_map
                
        return encoded_df, encoding_maps
    
    def scale_numerical_features(self, df: pd.DataFrame, columns: List[str]) -> Tuple[pd.DataFrame, Dict]:
        """
        Scale numerical features using min-max scaling and return scaling parameters.
        """
        scaled_df = df.copy()
        scaling_params = {}
        
        for column in columns:
            if column in scaled_df.columns:
                min_val = scaled_df[column].min()
                max_val = scaled_df[column].max()
                scaled_df[column] = (scaled_df[column] - min_val) / (max_val - min_val)
                scaling_params[column] = {'min': min_val, 'max': max_val}
                
        return scaled_df, scaling_params

    def create_time_features(self, df: pd.DataFrame, datetime_column: str) -> pd.DataFrame:
        """
        Create additional time-based features from a datetime column.
        """
        enhanced_df = df.copy()
        
        enhanced_df[f'{datetime_column}_hour'] = enhanced_df[datetime_column].dt.hour
        enhanced_df[f'{datetime_column}_day'] = enhanced_df[datetime_column].dt.day
        enhanced_df[f'{datetime_column}_month'] = enhanced_df[datetime_column].dt.month
        enhanced_df[f'{datetime_column}_day_of_week'] = enhanced_df[datetime_column].dt.dayofweek
        enhanced_df[f'{datetime_column}_is_weekend'] = enhanced_df[datetime_column].dt.dayofweek.isin([5, 6]).astype(int)
        
        return enhanced_df