import os
import logging
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import requests
from fastapi import FastAPI, WebSocket, HTTPException
from pydantic import BaseModel
import asyncio
import aiohttp
import torch
import torch.nn as nn
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from prophet import Prophet
import xgboost as xgb
import re
import random
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from collections import deque
from typing import Dict, List, Tuple, Optional, Deque
import json
from datetime import datetime, timedelta
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_nltk():
    """Download and verify all required NLTK resources"""
    try:
        # List of all required NLTK resources - removing punkt_tab as it's not a standard package
        required_resources = [
            'punkt',  # For sentence tokenization
            'stopwords',  # For stopwords
            'averaged_perceptron_tagger'  # For POS tagging
        ]
        
        # Download all required resources
        for package in required_resources:
            nltk.download(package, quiet=True)
        
        # Verify resources are available
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
        nltk.data.find('taggers/averaged_perceptron_tagger')
        
        logger.info("NLTK resources successfully downloaded and verified")
        return True
        
    except Exception as e:
        logger.error(f"Error setting up NLTK resources: {str(e)}")
        logger.info("Attempting alternative download method...")
        try:
            # Alternative download method
            import ssl
            try:
                _create_unverified_https_context = ssl._create_unverified_context
            except AttributeError:
                pass
            else:
                ssl._create_default_https_context = _create_unverified_https_context
            
            nltk.download('all', quiet=True)  # Download all NLTK data
            logger.info("Successfully downloaded all NLTK resources using alternative method")
            return True
            
        except Exception as alt_e:
            logger.error(f"Alternative download method failed: {str(alt_e)}")
            raise
    except Exception as e:
        logger.error(f"Unexpected error setting up NLTK resources: {str(e)}")
        raise

# Call setup function before proceeding
setup_nltk()

# Define intent configuration
INTENT_CONFIG = {
    'intents': {
        'flight_status': {
            'responses': [
                "Flight {flight_number} operated by {operator} is currently {status}.",
                "The current status of flight {flight_number} is {status}."
            ],
            'context_required': ['flight_number']
        },
        'delay_prediction': {
            'responses': [
                "Based on current conditions, flight {flight_number} may experience a delay of approximately {delay_minutes} minutes.",
                "We predict a possible {delay_minutes}-minute delay for flight {flight_number}."
            ],
            'context_required': ['flight_number']
        },
        'weather_impact': {
            'responses': [
                "Current weather conditions at the airport are {weather_condition}. You should {weather_impact}.",
                "The weather is {weather_condition}, with {weather_impact} on flights."
            ],
            'context_required': ['flight_number']
        },
        'gate_information': {
            'responses': [
                "Your flight departs from Gate {gate_number} in Terminal {terminal}.",
                "Please proceed to Gate {gate_number}, Terminal {terminal} for your flight."
            ],
            'context_required': ['flight_number']
        },
        'airport_status': {
            'responses': [
                "The airport is currently experiencing {congestion_level} congestion. Weather conditions are {weather_condition}.",
                "Terminal congestion is {congestion_level} with {weather_condition} weather conditions."
            ],
            'context_required': ['airport_code']
        }
    }
}

class ContextManager:
    """Manages conversation context and required entities"""
    def __init__(self):
        self.context = {}
        self.context_ttl = 300  # Time to live in seconds
        self.last_update = datetime.now()
    
    def update_context(self, entities: Dict):
        """Update context with new entities"""
        self.context.update(entities)
        self.last_update = datetime.now()
        self._clean_expired_context()
    
    def get_context(self, required_entities: List[str]) -> Tuple[Dict, List[str]]:
        """Get current context and list of missing required entities"""
        self._clean_expired_context()
        missing_entities = [
            entity for entity in required_entities 
            if entity not in self.context
        ]
        return self.context.copy(), missing_entities
    
    def clear_context(self):
        """Clear all context data"""
        self.context = {}
        self.last_update = datetime.now()
    
    def _clean_expired_context(self):
        """Remove expired context based on TTL"""
        if (datetime.now() - self.last_update).total_seconds() > self.context_ttl:
            self.clear_context()

class ConversationHistoryManager:
    """Manages conversation history and provides context for responses"""
    def __init__(self, max_history: int = 10):
        self.history: Deque[Dict] = deque(maxlen=max_history)
        self.session_data: Dict = {}
    
    def add_interaction(self, user_message: str, assistant_response: Dict):
        """Add a new interaction to the history"""
        self.history.append({
            'timestamp': datetime.now().isoformat(),
            'user_message': user_message,
            'assistant_response': assistant_response,
            'entities': assistant_response.get('entities', {})
        })
        
        # Update session data with any new entities
        if 'entities' in assistant_response:
            self.session_data.update(assistant_response['entities'])
    
    def get_recent_context(self, lookback: int = 3) -> List[Dict]:
        """Get recent conversation context"""
        return list(self.history)[-lookback:]
    
    def get_last_intent(self) -> Optional[str]:
        """Get the last processed intent"""
        if self.history:
            return self.history[-1]['assistant_response'].get('intent')
        return None
    
    def get_session_data(self) -> Dict:
        """Get accumulated session data"""
        return self.session_data.copy()
    
    def clear_history(self):
        """Clear conversation history"""
        self.history.clear()
        self.session_data.clear()

class EnhancedFlightAssistant:
    """Enhanced flight assistant with improved natural language understanding and context awareness"""
    def __init__(self, intent_file_path: str):
        self.intent_classifier = IntentClassifier(intent_file_path)
        self.entity_extractor = EntityExtractor()
        self.context_manager = ContextManager()
        self.flight_data = MockFlightData()
        self.delay_predictor = FlightDelayPredictor()
        self.flow_predictor = PassengerFlowPredictor()
        self.conversation_manager = ConversationHistoryManager()
        
        # Add new intents for broader coverage
        self.additional_intents = {
            'destination_inquiry': {
                'patterns': [
                    "how (can|do) I get to",
                    "flights? to",
                    "travel to",
                    "going to"
                ],
                'responses': [
                    "For travel to {destination}, we have flights available from {departure_airports}. Would you like to know specific flight options?",
                    "I can help you find flights to {destination}. Which city would you like to depart from?"
                ]
            },
            'baggage_inquiry': {
                'patterns': [
                    "baggage",
                    "luggage",
                    "goods",
                    "check(ed)?",
                    "carry[- ]?on",
                    "customs"
                ],
                'responses': [
                    "For international flights to {destination}, all checked baggage will go through customs inspection. The standard baggage allowance is {baggage_allowance}.",
                    "Yes, all goods must be declared and may be inspected by customs at {destination}. Would you like information about baggage allowances?"
                ]
            },
            'greeting': {
                'patterns': [
                    "hello",
                    "hi",
                    "hey",
                    "good (morning|afternoon|evening)"
                ],
                'responses': [
                    "Hello! How can I assist you with your travel plans today?",
                    "Hi there! I can help you with flight information, baggage policies, and travel requirements. What would you like to know?"
                ]
            }
        }
        
        self.intent_classifier.train()

    async def process_message(self, message: str) -> Dict:
        """Process incoming user message with improved context awareness"""
        try:
            # Extract location entities
            locations = self._extract_locations(message)
            
            # Check for greeting intent first
            if self._is_greeting(message.lower()):
                return {
                    'response': random.choice(self.additional_intents['greeting']['responses']),
                    'intent': 'greeting'
                }
            
            # Check for destination inquiry
            if locations and any(pattern in message.lower() for pattern in self.additional_intents['destination_inquiry']['patterns']):
                destination = locations[0]
                return await self._handle_destination_inquiry(destination)
            
            # Check for baggage/customs inquiry
            if any(pattern in message.lower() for pattern in self.additional_intents['baggage_inquiry']['patterns']):
                return await self._handle_baggage_inquiry(locations[0] if locations else None)
            
            # Fall back to regular intent classification
            intent_data = self.intent_classifier.predict_intent(message)
            entities = self.entity_extractor.extract_entities(message)
            
            # Update context with new information
            self.context_manager.update_context(entities)
            
            # Get required context and check for missing entities
            required_entities = intent_data['requires_context']
            context, missing_entities = self.context_manager.get_context(required_entities)
            
            if missing_entities:
                return self._generate_contextual_question(missing_entities[0], context)
            
            # Process intent with full context
            entities.update(context)
            response_data = await self._process_intent(intent_data['intent'], entities)
            response = self._generate_response(intent_data['intent'], response_data, entities)
            
            return {
                'response': response,
                'intent': intent_data['intent'],
                'confidence': intent_data['confidence'],
                'entities': entities,
                'additional_data': response_data
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            return {
                'response': "I apologize, but I need more information to help you. Could you please provide more details about your travel plans?",
                'error': str(e)
            }

    def _extract_locations(self, message: str) -> List[str]:
        """Extract location names from message using NLP"""
        # This would be enhanced with a proper NER model
        common_cities = ['lagos', 'london', 'new york', 'dubai', 'paris']
        words = message.lower().split()
        return [word for word in words if word in common_cities]

    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting"""
        return any(pattern in message.lower() for pattern in self.additional_intents['greeting']['patterns'])

    async def _handle_destination_inquiry(self, destination: str) -> Dict:
        """Handle inquiries about traveling to specific destinations"""
        # Mock data - would be replaced with real flight database
        departure_airports = ['JFK', 'LHR', 'LAX']
        response = self.additional_intents['destination_inquiry']['responses'][0].format(
            destination=destination.title(),
            departure_airports=', '.join(departure_airports)
        )
        
        return {
            'response': response,
            'intent': 'destination_inquiry',
            'entities': {'destination': destination}
        }

    async def _handle_baggage_inquiry(self, destination: Optional[str]) -> Dict:
        """Handle inquiries about baggage and customs"""
        baggage_allowance = "2 checked bags up to 23kg each"
        
        if destination:
            response = self.additional_intents['baggage_inquiry']['responses'][0].format(
                destination=destination.title(),
                baggage_allowance=baggage_allowance
            )
        else:
            response = ("All checked baggage must go through security screening. "
                       f"The standard allowance is {baggage_allowance}. "
                       "Would you like information about a specific destination?")
        
        return {
            'response': response,
            'intent': 'baggage_inquiry',
            'entities': {'destination': destination} if destination else {}
        }

    def _generate_contextual_question(self, missing_entity: str, context: Dict) -> Dict:
        """Generate context-aware questions for missing information"""
        if missing_entity == 'flight_number':
            if 'destination' in context:
                return {
                    'response': f"I see you're interested in traveling to {context['destination']}. "
                               "Do you have a specific flight number you'd like to check?",
                    'missing_entities': [missing_entity]
                }
            return {
                'response': "Could you please provide your flight number?",
                'missing_entities': [missing_entity]
            }
        
        # Add more contextual questions as needed
        return super()._generate_missing_entity_response(missing_entity)
  
class MockFlightData:
    """Mock flight data provider"""
    def __init__(self):
        self.flight_statuses = ['ON_TIME', 'DELAYED', 'BOARDING', 'DEPARTED', 'ARRIVED']
        self.weather_conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain', 'Thunderstorm']
        
    async def get_flight_info(self, flight_number: str) -> Dict:
        """Get mock flight information"""
        return {
            'flight_number': flight_number,
            'operator': random.choice(['Delta', 'United', 'American', 'Southwest']),
            'status': random.choice(self.flight_statuses),
            'departure': {
                'airport': 'JFK',
                'scheduled': datetime.now().isoformat(),
                'estimated': (datetime.now() + timedelta(minutes=random.randint(-30, 60))).isoformat()
            },
            'arrival': {
                'airport': 'LAX',
                'scheduled': (datetime.now() + timedelta(hours=6)).isoformat(),
                'estimated': (datetime.now() + timedelta(hours=6, minutes=random.randint(-30, 60))).isoformat()
            }
        }
    
    async def get_airport_info(self, airport_code: str) -> Dict:
        """Get mock airport information"""
        return {
            'code': airport_code,
            'name': f'{airport_code} International Airport',
            'weather': {
                'condition': random.choice(self.weather_conditions),
                'temperature': random.randint(15, 30),
                'wind_speed': random.randint(0, 30),
                'visibility': random.randint(3, 15)
            },
            'num_flights': random.randint(50, 200)
        }

class FlightDelayPredictor:
    """Predicts flight delays based on various factors"""
    def __init__(self):
        self.delay_factors = [
            'Weather conditions',
            'Airport congestion',
            'Airline operations',
            'Time of day'
        ]
    
    def predict_delay(self, departure_time: datetime, weather: Dict) -> Tuple[float, List[str]]:
        """Predict delay and return contributing factors"""
        base_delay = random.randint(0, 45)
        
        if weather['condition'] in ['Thunderstorm', 'Snow']:
            base_delay += random.randint(30, 90)
        elif weather['condition'] == 'Rain':
            base_delay += random.randint(15, 45)
        
        factors = []
        if base_delay > 30:
            factors.extend(random.sample(self.delay_factors, 2))
        elif base_delay > 0:
            factors.append(random.choice(self.delay_factors))
        
        return float(base_delay), factors

class PassengerFlowPredictor:
    """Predicts passenger flow levels at airports"""
    def __init__(self):
        self.flow_levels = ['LOW', 'MODERATE', 'HIGH', 'VERY HIGH']
    
    def predict_flow(self, current_state: Dict) -> Tuple[str, float]:
        """Predict passenger flow level and confidence"""
        hour = current_state['time_of_day']
        is_peak = 7 <= hour <= 9 or 16 <= hour <= 19
        is_weekend = current_state['day_of_week'] >= 5
        
        if is_peak and (is_weekend or current_state['is_holiday']):
            flow_level = 'VERY HIGH'
        elif is_peak:
            flow_level = 'HIGH'
        elif is_weekend:
            flow_level = 'MODERATE'
        else:
            flow_level = 'LOW'
        
        confidence = random.uniform(0.7, 0.95)
        return flow_level, confidence

class IntentClassifier:
    """Enhanced intent classification using TF-IDF and Random Forest"""
    def __init__(self, intent_file_path: str):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 3))
        self.classifier = RandomForestClassifier(n_estimators=100)
        self.intent_patterns = {}
        self.trained = False
        self.stop_words = set(stopwords.words('english'))
        self.intent_config = INTENT_CONFIG
        
    def _generate_training_data(self):
        """Generate training data from intent patterns"""
        X = []
        y = []
        
        patterns = {
            'flight_status': [
                "What's the status of flight {flight_number}",
                "Is flight {flight_number} on time",
                "Check flight {flight_number} status"
            ],
            'delay_prediction': [
                "Will flight {flight_number} be delayed",
                "Is there a delay for {flight_number}",
                "Delay prediction for {flight_number}"
            ],
            'weather_impact': [
                "How's the weather affecting flights",
                "Weather impact on flight {flight_number}",
                "Will weather delay flight {flight_number}"
            ],
            'gate_information': [
                "What gate is flight {flight_number}",
                "Which terminal for {flight_number}",
                "Where does flight {flight_number} depart from"
            ],
            'airport_status': [
                "How busy is {airport_code} airport",
                "What's the situation at {airport_code}",
                "Current status of {airport_code} airport"
            ]
        }
        
        for intent, intent_patterns in patterns.items():
            for pattern in intent_patterns:
                variations = self._generate_pattern_variations(pattern)
                X.extend(variations)
                y.extend([intent] * len(variations))
        
        return X, y
    
    def _generate_pattern_variations(self, pattern: str) -> List[str]:
        """Generate variations of patterns for better training"""
        variations = [pattern]
        pattern_with_examples = (pattern
            .replace("{flight_number}", "AA123")
            .replace("{airport_code}", "JFK")
        )
        variations.append(pattern_with_examples)
        
        prefixes = [
            "Could you tell me",
            "I need to know",
            "Please",
            "Can you check",
            "I want to know"
        ]
        
        for prefix in prefixes:
            variations.append(f"{prefix} {pattern}")
        
        return variations
    
    def preprocess_text(self, text: str) -> str:
        """Preprocess text using NLTK"""
        tokens = word_tokenize(text.lower())
        tokens = [token for token in tokens if token not in self.stop_words]
        return " ".join(tokens)
    
    def train(self):
        """Train the intent classifier"""
        X, y = self._generate_training_data()
        X = [self.preprocess_text(text) for text in X]
        X_tfidf = self.vectorizer.fit_transform(X)
        self.classifier.fit(X_tfidf, y)
        self.trained = True
    
    def predict_intent(self, text: str) -> Dict:
        """Predict intent for given text"""
        if not self.trained:
            raise ValueError("Model needs to be trained first")
        
        processed_text = self.preprocess_text(text)
        X_tfidf = self.vectorizer.transform([processed_text])
        intent = self.classifier.predict(X_tfidf)[0]
        probabilities = self.classifier.predict_proba(X_tfidf)[0]
        
        return {
            'intent': intent,
            'confidence': float(np.max(probabilities)),
            'requires_context': self.intent_config['intents'][intent]['context_required']
        }

class EntityExtractor:
    """Enhanced entity extraction using regex patterns"""
    def __init__(self):
        self.patterns = {
            'flight_number': r'([A-Z]{2})\s*(\d{3,4})',
            'airport_code': r'\b([A-Z]{3})\b'
        }
    
    def extract_entities(self, text: str) -> Dict:
        """Extract entities from text using regex patterns"""
        entities = {}
        
        for entity_type, pattern in self.patterns.items():
            matches = re.findall(pattern, text.upper())
            if matches:
                if entity_type == 'flight_number':
                    entities[entity_type] = f"{matches[0][0]}{matches[0][1]}"
                else:
                    entities[entity_type] = matches[0]
        
        date_pattern = r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b'
        time_pattern = r'\b\d{1,2}:\d{2}\b'
        
        date_matches = re.findall(date_pattern, text)
        time_matches = re.findall(time_pattern, text)
        
        if date_matches:
            entities['date'] = date_matches[0]
        if time_matches:
            entities['time'] = time_matches[0]
        
        return entities

class EnhancedFlightAssistant:
    """Enhanced flight assistant with improved NLU capabilities"""
    def __init__(self, intent_file_path: str):
        self.intent_classifier = IntentClassifier(intent_file_path)
        self.entity_extractor = EntityExtractor()
        self.context_manager = ContextManager()
        self.flight_data = MockFlightData()
        self.delay_predictor = FlightDelayPredictor()
        self.flow_predictor = PassengerFlowPredictor()
        
        self.intent_classifier.train()

    async def process_message(self, message: str) -> Dict:
        """Process incoming user message"""
        try:
            intent_data = self.intent_classifier.predict_intent(message)
            entities = self.entity_extractor.extract_entities(message)

            self.context_manager.update_context(entities)
            required_entities = intent_data['requires_context']
            context, missing_entities = self.context_manager.get_context(required_entities)
            
            if missing_entities:
                return {
                    'response': self._generate_missing_entity_response(missing_entities[0]),
                    'missing_entities': missing_entities,
                    'intent': intent_data['intent']
                }
            
            entities.update(context)
            response_data = await self._process_intent(intent_data['intent'], entities)
            response = self._generate_response(intent_data['intent'], response_data, entities)
            
            return {
                'response': response,
                'intent': intent_data['intent'],
                'confidence': intent_data['confidence'],
                'entities': entities,
                'additional_data': response_data
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            return {
                'response': "I apologize, but I'm having trouble processing your request.",
                'error': str(e)
            }
    
    def _generate_missing_entity_response(self, missing_entity: str) -> str:
        """Generate response requesting missing information"""
        templates = {
            'flight_number': [
                "Could you please provide the flight number?",
                "I'll need the flight number to help you with that.",
                "What's your flight number?"
            ],
            'airport_code': [
                "Which airport are you interested in?",
                "Could you specify the airport code?",
                "Which airport would you like information about?"
            ]
        }
        
        return random.choice(templates.get(missing_entity, ["Could you provide more information?"]))

    async def _process_intent(self, intent: str, entities: Dict) -> Dict:
        """Process the intent and return relevant data"""
        response_data = {}
        
        try:
            if 'flight_number' in entities:
                flight_info = await self.flight_data.get_flight_info(entities['flight_number'])
                response_data['flight_info'] = flight_info
                
                if intent == 'delay_prediction':
                    dep_airport = await self.flight_data.get_airport_info(
                        flight_info['departure']['airport']
                    )
                    delay_prediction, delay_factors = self.delay_predictor.predict_delay(
                        datetime.now() + timedelta(hours=1),
                        dep_airport['weather']
                    )
                    response_data['delay_prediction'] = {
                        'predicted_delay': float(delay_prediction),
                        'factors': delay_factors
                    }
                
                elif intent == 'weather_impact':
                    dep_airport = await self.flight_data.get_airport_info(
                        flight_info['departure']['airport']
                    )
                    response_data['weather_impact'] = {
                        'conditions': dep_airport['weather'],
                        'impact_level': self._assess_weather_impact(dep_airport['weather'])
                    }
                
                elif intent == 'gate_information':
                    response_data['gate_info'] = self._generate_gate_info(flight_info)
                
                elif intent == 'connection_info':
                    response_data['connection_info'] = self._generate_connection_info(flight_info)
            
            elif 'airport_code' in entities:
                airport_info = await self.flight_data.get_airport_info(entities['airport_code'])
                response_data['airport_info'] = airport_info
                
                if intent == 'airport_status':
                    current_state = {
                        'time_of_day': datetime.now().hour,
                        'day_of_week': datetime.now().weekday(),
                        'is_holiday': self._is_holiday(datetime.now()),
                        'num_flights': airport_info.get('num_flights', 100),
                        'weather_condition': self._get_weather_condition_code(
                            airport_info['weather']['condition']
                        )
                    }
                    
                    flow_level, flow_confidence = self.flow_predictor.predict_flow(current_state)
                    response_data['passenger_flow'] = {
                        'level': flow_level,
                        'confidence': flow_confidence
                    }
        
        except Exception as e:
            logger.error(f"Error processing intent {intent}: {str(e)}")
            response_data['error'] = str(e)
        
        return response_data
    
    def _assess_weather_impact(self, weather: Dict) -> str:
        """Assess the impact of weather conditions on flights"""
        impact_level = "minimal"
        
        if weather['condition'] in ['Thunderstorm', 'Snow', 'Heavy Rain']:
            impact_level = "severe"
        elif weather['wind_speed'] > 25:
            impact_level = "significant"
        elif weather['visibility'] < 5:
            impact_level = "moderate"
        elif weather['condition'] in ['Rain', 'Cloudy'] or weather['wind_speed'] > 15:
            impact_level = "slight"
        
        return impact_level
    
    def _generate_gate_info(self, flight_info: Dict) -> Dict:
        """Generate gate and terminal information"""
        terminal = random.choice(['A', 'B', 'C', 'D'])
        gate = f"{terminal}{random.randint(1, 20)}"
        
        return {
            'departure_terminal': terminal,
            'departure_gate': gate,
            'boarding_time': (datetime.fromisoformat(flight_info['departure']['scheduled']) 
                            - timedelta(minutes=30)).isoformat()
        }
    
    def _generate_connection_info(self, flight_info: Dict) -> Dict:
        """Generate connection information"""
        connection_time = random.randint(45, 180)
        arrival_terminal = random.choice(['A', 'B', 'C', 'D'])
        next_terminal = random.choice(['A', 'B', 'C', 'D'])
        
        return {
            'connection_time': connection_time,
            'arrival_terminal': arrival_terminal,
            'next_terminal': next_terminal,
            'next_gate': f"{next_terminal}{random.randint(1, 20)}",
            'transfer_time_estimate': self._estimate_transfer_time(arrival_terminal, next_terminal)
        }
    
    def _estimate_transfer_time(self, from_terminal: str, to_terminal: str) -> int:
        """Estimate transfer time between terminals"""
        if from_terminal == to_terminal:
            return random.randint(5, 15)
        else:
            return random.randint(15, 45)
    
    def _is_holiday(self, date: datetime) -> bool:
        """Check if a given date is a holiday"""
        # Mock implementation - could be replaced with actual holiday calendar
        return False
    
    def _get_weather_condition_code(self, condition: str) -> int:
        """Convert weather condition to numeric code"""
        conditions = {
            'Clear': 0,
            'Partly Cloudy': 1,
            'Cloudy': 2,
            'Rain': 3,
            'Thunderstorm': 4
        }
        return conditions.get(condition, 0)

    def _generate_response(self, intent: str, response_data: Dict, entities: Dict) -> str:
        """Generate natural language response with improved error handling"""
        if 'error' in response_data:
            return "I apologize, but I encountered an error while processing your request."
        
        try:
            templates = INTENT_CONFIG['intents'][intent]['responses']
            template = random.choice(templates)
            
            # Initialize format data with defaults to prevent KeyError
            format_data = {
                'congestion_level': 'normal',  # Default value
                'weather_condition': 'clear',   # Default value
                'flight_number': '',
                'operator': '',
                'status': '',
                'delay_minutes': 0,
                'gate_number': '',
                'terminal': '',
                'weather_impact': ''
            }
            
            # Update with provided entities
            format_data.update(entities)
            
            # Update with flight information
            if 'flight_info' in response_data:
                flight = response_data['flight_info']
                format_data.update({
                    'status': flight['status'].replace('_', ' ').title(),
                    'operator': flight['operator']
                })
            
            # Update with delay prediction
            if 'delay_prediction' in response_data:
                format_data['delay_minutes'] = int(response_data['delay_prediction']['predicted_delay'])
            
            # Update with weather impact
            if 'weather_impact' in response_data:
                weather = response_data['weather_impact']
                format_data.update({
                    'weather_condition': weather['conditions']['condition'],
                    'weather_impact': f"expect {weather['impact_level']} impact"
                })
            
            # Update with gate information
            if 'gate_info' in response_data:
                gate = response_data['gate_info']
                format_data.update({
                    'gate_number': gate['departure_gate'],
                    'terminal': gate['departure_terminal']
                })
            
            # Update with airport and passenger flow information
            if 'airport_info' in response_data and 'passenger_flow' in response_data:
                flow_data = response_data['passenger_flow']
                weather_data = response_data['airport_info'].get('weather', {})
                
                format_data.update({
                    'congestion_level': flow_data.get('level', 'normal').lower(),
                    'weather_condition': weather_data.get('condition', 'clear').lower()
                })
            
            # Generate response using template
            try:
                response = template.format(**format_data)
            except KeyError as ke:
                logger.error(f"Template formatting error: Missing key {ke}")
                # Fallback response based on intent
                fallback_responses = {
                    'airport_status': f"The airport is currently experiencing {format_data['congestion_level']} congestion.",
                    'flight_status': f"Flight {format_data['flight_number']} is {format_data['status']}.",
                    'delay_prediction': f"Predicted delay: {format_data['delay_minutes']} minutes.",
                    'weather_impact': f"Current weather is {format_data['weather_condition']}.",
                    'gate_information': f"Gate {format_data['gate_number']} in Terminal {format_data['terminal']}."
                }
                response = fallback_responses.get(intent, "I have the information but am having trouble formatting the response.")
            
            # Add additional context if available
            additional_info = []
            if 'passenger_flow' in response_data:
                flow = response_data['passenger_flow']
                if 'level' in flow:
                    additional_info.append(
                        f"Terminal congestion is currently {flow['level'].lower()}."
                    )
            
            if 'weather_impact' in response_data and intent != 'weather_impact':
                impact = response_data['weather_impact']['impact_level']
                additional_info.append(
                    f"Weather conditions are expected to have {impact} impact."
                )
            
            if additional_info:
                response += f" {' '.join(additional_info)}"
            
            return response
                
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return f"I understand your request about {intent}, but I'm having trouble formulating a response."

            
            additional_info = []
            if 'passenger_flow' in response_data:
                flow = response_data['passenger_flow']
                if 'level' in flow:
                    additional_info.append(
                        f"Terminal congestion is currently {flow['level'].lower()}."
                    )
            
            if 'weather_impact' in response_data and intent != 'weather_impact':
                impact = response_data['weather_impact']['impact_level']
                additional_info.append(
                    f"Weather conditions are expected to have {impact} impact."
                )
            
            if additional_info:
                response += f" {' '.join(additional_info)}"
            
            return response
                
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return f"I understand your request about {intent}, but I'm having trouble formulating a response."

# FastAPI application setup
app = FastAPI(title="Enhanced Flight Assistant API")

# Update the WebSocket endpoint to maintain conversation state per connection
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication with conversation state"""
    await websocket.accept()
    
    try:
        # Initialize assistant with intent file path
        intent_file_path = os.path.join(os.path.dirname(__file__), 'intents.json')
        assistant = EnhancedFlightAssistant(intent_file_path)
        
        while True:
            data = await websocket.receive_json()
            
            # Check for conversation reset command
            if data.get('command') == 'reset_conversation':
                assistant.conversation_manager.clear_history()
                await websocket.send_json({
                    'response': 'Conversation history has been reset.',
                    'status': 'reset_successful'
                })
                continue
            
            response = await assistant.process_message(data['message'])
            await websocket.send_json(response)
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
            
            