import os
import logging
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import deque
import aiohttp
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import re
from pathlib import Path

print("Starting Flight Assistant service...")

# Configure logging with both file and console output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('flight_assistant.log'),
        logging.StreamHandler()  # Add console logging
    ]
)
logger = logging.getLogger(__name__)

# Define the absolute paths for data files
CURRENT_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
AIRLINE_DATA_PATH = CURRENT_DIR / 'airline_data.json'
AIRPORT_DATA_PATH = CURRENT_DIR / 'airport_data.json'
INTENTS_DATA_PATH = CURRENT_DIR / 'intents.json'  # Updated path to be relative

# Create fallback data files if they don't exist
def create_fallback_data_files():
    # Fallback airport data
    fallback_airports = {
        "JFK": {"name": "John F. Kennedy International Airport", "city": "New York", "country": "United States"},
        "LAX": {"name": "Los Angeles International Airport", "city": "Los Angeles", "country": "United States"},
        "LHR": {"name": "Heathrow Airport", "city": "London", "country": "United Kingdom"},
        "SFO": {"name": "San Francisco International Airport", "city": "San Francisco", "country": "United States"},
        "ORD": {"name": "O'Hare International Airport", "city": "Chicago", "country": "United States"}
    }
    
    # Fallback airline data
    fallback_airlines = {
        "AA": {"name": "American Airlines", "country": "United States"},
        "DL": {"name": "Delta Air Lines", "country": "United States"},
        "UA": {"name": "United Airlines", "country": "United States"},
        "BA": {"name": "British Airways", "country": "United Kingdom"},
        "LH": {"name": "Lufthansa", "country": "Germany"}
    }
    
    # Create airport data file if it doesn't exist
    if not AIRPORT_DATA_PATH.exists():
        with open(AIRPORT_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(fallback_airports, f, indent=2)
            logger.info(f"Created fallback airport data at {AIRPORT_DATA_PATH}")
    
    # Create airline data file if it doesn't exist
    if not AIRLINE_DATA_PATH.exists():
        with open(AIRLINE_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(fallback_airlines, f, indent=2)
            logger.info(f"Created fallback airline data at {AIRLINE_DATA_PATH}")
            
    # Create fallback intents file if it doesn't exist
    if not INTENTS_DATA_PATH.exists():
        fallback_intents = {
            "intents": {
                "greeting": {
                    "examples": ["hello", "hi", "hey", "greetings", "good day", "what's up", "how are you"],
                    "responses": ["Hello! How can I assist you with your flight today?", "Hi there! Need any flight information?", "Greetings! How may I help you with your travel plans?"]
                },
                "goodbye": {
                    "examples": ["bye", "goodbye", "see you later", "farewell", "thanks bye"],
                    "responses": ["Goodbye! Have a safe flight!", "Farewell! Thanks for using our flight assistant.", "See you later! Safe travels!"]
                },
                "thanks": {
                    "examples": ["thanks", "thank you", "appreciate it", "helpful", "great help"],
                    "responses": ["You're welcome!", "Happy to help!", "Anytime!", "Glad I could assist!"]
                }
            }
        }
        with open(INTENTS_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(fallback_intents, f, indent=2)
            logger.info(f"Created fallback intents data at {INTENTS_DATA_PATH}")

# Create fallback data files if needed
try:
    create_fallback_data_files()
except Exception as e:
    logger.warning(f"Could not create fallback data files: {e}")


class IntentManager:
    """Manages loading and processing of intents"""
    
    def __init__(self, intents_path=None):
        self.intents_path = intents_path or INTENTS_DATA_PATH
        self.intents = self._load_intents()
        logger.info(f"Intent Manager initialized with {len(self.intents.get('intents', {}))} intents")

    def _load_intents(self) -> Dict:
        try:
            if Path(self.intents_path).exists():
                with open(self.intents_path, 'r', encoding='utf-8') as f:
                    logger.info(f"Loading intents from {self.intents_path}")
                    data = json.load(f)
                    logger.info(f"Loaded intents data type: {type(data)}")

                    # Case 1: Correct format {"intents": {...}}
                    if isinstance(data, dict) and "intents" in data:
                        if isinstance(data["intents"], list):
                            logger.info("Converting list-format intents to dictionary format")
                            intents_dict = {}
                            for item in data["intents"]:
                                if "intent" in item and "examples" in item:
                                    intent_name = item["intent"].lower()  # Normalize to lowercase
                                    intents_dict[intent_name] = {
                                        "examples": item["examples"],
                                        "responses": item.get("responses", ["I understand you want to talk about " + intent_name])
                                    }
                            return {"intents": intents_dict}
                        elif isinstance(data["intents"], dict):
                            return data

                    # Case 2: Bare dictionary without "intents" key
                    if isinstance(data, dict) and "intents" not in data:
                        logger.warning(f"No 'intents' key found, treating data as intents dictionary")
                        return {"intents": data}

                    # Case 3: Invalid format - return a fallback structure
                    logger.error(f"Invalid intents format: {type(data)}. Using fallback intents.")
                    return self._create_fallback_intents()
            else:
                logger.warning(f"Intents file not found at {self.intents_path}")
                return self._create_fallback_intents()
        except Exception as e:
            logger.error(f"Error loading intents: {e}", exc_info=True)
            return self._create_fallback_intents()
    
    def _create_fallback_intents(self) -> Dict:
        """Create a fallback intents structure"""
        return {
            "intents": {
                "greeting": {
                    "examples": ["hello", "hi", "hey", "greetings", "good day"],
                    "responses": ["Hello! How can I assist you with your flight today?"]
                },
                "goodbye": {
                    "examples": ["bye", "goodbye", "see you later"],
                    "responses": ["Goodbye! Have a safe flight!"]
                }
            }
        }

    def get_response_for_intent(self, intent_name: str) -> str:
        """Get a random response for the given intent"""
        try:
            if not intent_name:
                return None
                
            intents_dict = self.intents.get("intents", {})
            
            if not isinstance(intents_dict, dict):
                logger.error(f"Expected intents to be a dict, got {type(intents_dict)}")
                return None
                
            if intent_name in intents_dict:
                intent_data = intents_dict[intent_name]
                
                if isinstance(intent_data, dict) and "responses" in intent_data:
                    responses = intent_data["responses"]
                    if isinstance(responses, list) and responses:
                          return intent_name
            
            if best_score >= 0.6:
                return best_intent
            return None
        except Exception as e:
            logger.error(f"Error matching intent: {e}", exc_info=True)
            return None   
            
        except Exception as e:
            logger.error(f"Error getting response for intent {intent_name}: {e}", exc_info=True)
            return None

        # In the IntentManager class, improve the match_intent method
    def match_intent(self, message: str) -> str:
        """Match user message to an intent"""
        try:
            if not message:
                return None
                
            message = message.lower().strip()
            
            # Direct matching for common greetings
            common_greetings = ["hello", "hi", "hey", "greetings", "good day", "what's up", "how are you"]
            if message in common_greetings:
                return "greeting"
                
            best_intent = None
            best_score = 0
            
            intents_dict = self.intents.get("intents", {})
            
            if not isinstance(intents_dict, dict):
                logger.error(f"Expected intents to be a dict, got {type(intents_dict)}")
                return None
                
            for intent_name, intent_data in intents_dict.items():
                if not isinstance(intent_data, dict):
                    logger.warning(f"Intent data for {intent_name} is not a dictionary: {type(intent_data)}")
                    continue
                    
                examples = intent_data.get("examples", [])
                if not isinstance(examples, list):
                    logger.warning(f"Examples for {intent_name} is not a list: {type(examples)}")
                    continue
                    
                for example in examples:
                    if not isinstance(example, str):
                        continue
                        
                    example_words = set(example.lower().split())
                    if not example_words:
                        continue
                        
                    message_words = set(message.split())
                    common_words = example_words.intersection(message_words)
                    
                    score = len(common_words) / len(example_words) if example_words else 0
                    
                    if score > best_score:
                        best_score = score
                        best_intent = intent_name
                        
                    if re.search(r'\b' + re.escape(example.lower()) + r'\b', message):
                        return intent_name
            
            if best_score >= 0.6:
                return best_intent
            return None
        except Exception as e:
            logger.error(f"Error matching intent: {e}", exc_info=True)
            return None
        
class FlightDataConnector:
    """Enhanced connector for flight data with improved caching and error handling"""
    
    def __init__(self, api_key=None, mock_mode=False):
        self.api_key = api_key or os.environ.get("AVIATION_API_KEY")
        self.base_url = "http://api.aviationstack.com/v1"  # Replace with actual API
        self.cache = {}
        self.cache_expiry = {}
        self.cache_ttl = timedelta(minutes=15)
        self.mock_mode = mock_mode or not self.api_key
        self.airport_data = self._load_airport_data()
        self.airline_data = self._load_airline_data()
        logger.info(f"FlightDataConnector initialized. Mock mode: {self.mock_mode}")
        
    def _load_airport_data(self) -> Dict[str, Dict]:
        try:
            if AIRPORT_DATA_PATH.exists():
                with open(AIRPORT_DATA_PATH, 'r', encoding='utf-8') as f:
                    logger.info(f"Loading airport data from {AIRPORT_DATA_PATH}")
                    data = json.load(f)
                    if isinstance(data, list):
                        logger.warning("Airport data is a list, converting to dictionary")
                        data_dict = {}
                        for item in data:
                            if isinstance(item, dict) and 'code' in item:
                                data_dict[item['code']] = item
                        return data_dict
                    return data
            else:
                logger.warning(f"Airport data file not found at {AIRPORT_DATA_PATH}")
        except Exception as e:
            logger.warning(f"Error loading airport data: {e}")
        logger.info("Using fallback airport data")
        return {
            "JFK": {"name": "John F. Kennedy International Airport", "city": "New York", "country": "United States"},
            "LAX": {"name": "Los Angeles International Airport", "city": "Los Angeles", "country": "United States"},
            "LHR": {"name": "Heathrow Airport", "city": "London", "country": "United Kingdom"},
            "SFO": {"name": "San Francisco International Airport", "city": "San Francisco", "country": "United States"},
            "ORD": {"name": "O'Hare International Airport", "city": "Chicago", "country": "United States"}
        }
    
    def _load_airline_data(self) -> Dict[str, Dict]:
        try:
            if AIRLINE_DATA_PATH.exists():
                with open(AIRLINE_DATA_PATH, 'r', encoding='utf-8') as f:
                    logger.info(f"Loading airline data from {AIRLINE_DATA_PATH}")
                    data = json.load(f)
                    if isinstance(data, list):
                        logger.warning("Airline data is a list, converting to dictionary")
                        data_dict = {}
                        for item in data:
                            if isinstance(item, dict) and 'code' in item:
                                data_dict[item['code']] = item
                        return data_dict
                    return data
            else:
                logger.warning(f"Airline data file not found at {AIRLINE_DATA_PATH}")
        except Exception as e:
            logger.warning(f"Error loading airline data: {e}")
        logger.info("Using fallback airline data")
        return {
            "AA": {"name": "American Airlines", "country": "United States"},
            "DL": {"name": "Delta Air Lines", "country": "United States"},
            "UA": {"name": "United Airlines", "country": "United States"},
            "BA": {"name": "British Airways", "country": "United Kingdom"},
            "LH": {"name": "Lufthansa", "country": "Germany"}
        }
            
    async def get_flight_status(self, flight_number: str, date: str = None) -> Dict:
        logger.debug(f"Fetching flight status for {flight_number} on {date}")
        flight_number = flight_number.upper().replace(' ', '')
        date = date or datetime.now().strftime("%Y-%m-%d")
        
        try:
            if date in ['today', 'TODAY']:
                date = datetime.now().strftime("%Y-%m-%d")
            elif date in ['tomorrow', 'TOMORROW']:
                tomorrow = datetime.now() + timedelta(days=1)
                date = tomorrow.strftime("%Y-%m-%d")
            elif not re.match(r'^\d{4}-\d{2}-\d{2}$', date):
                if re.match(r'^\d{2}/\d{2}/\d{4}$', date):
                    month, day, year = date.split('/')
                    date = f"{year}-{month}-{day}"
                else:
                    logger.warning(f"Invalid date format: {date}. Using today.")
                    date = datetime.now().strftime("%Y-%m-%d")
        except Exception as e:
            logger.warning(f"Error parsing date: {e}")
            date = datetime.now().strftime("%Y-%m-%d")
            
        cache_key = f"{flight_number}_{date}"
        
        if cache_key in self.cache and datetime.now() < self.cache_expiry.get(cache_key, datetime.min):
            logger.info(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
            
        if self.mock_mode:
            flight_data = self._generate_mock_data(flight_number, date)
            self.cache[cache_key] = flight_data
            self.cache_expiry[cache_key] = datetime.now() + self.cache_ttl
            return flight_data
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/flights",
                    params={"flight_iata": flight_number, "date": date, "api_key": self.api_key},
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if not data.get('data'):
                            logger.warning(f"No flight data for {flight_number}")
                            return self._generate_mock_data(flight_number, date)
                        flight_info = data['data'][0]
                        flight_data = self._process_flight_info(flight_info, flight_number)
                        self.cache[cache_key] = flight_data
                        self.cache_expiry[cache_key] = datetime.now() + self.cache_ttl
                        return flight_data
                    else:
                        logger.error(f"API error: Status {response.status}")
                        return self._generate_mock_data(flight_number, date)
        except Exception as e:
            logger.error(f"Error fetching flight data: {e}", exc_info=True)
            return self._generate_mock_data(flight_number, date)
            
    def _process_flight_info(self, flight_info: Dict, flight_number: str) -> Dict:
        flight_data = {
            "flight_number": flight_number,
            "operator": flight_info.get("airline", {}).get("name", "Unknown Airline"),
            "status": flight_info.get("flight_status", "Unknown").capitalize(),
            "departure_airport": flight_info.get("departure", {}).get("iata", ""),
            "arrival_airport": flight_info.get("arrival", {}).get("iata", ""),
            "scheduled_departure": flight_info.get("departure", {}).get("scheduled", ""),
            "estimated_departure": flight_info.get("departure", {}).get("estimated", ""),
            "scheduled_arrival": flight_info.get("arrival", {}).get("scheduled", ""),
            "estimated_arrival": flight_info.get("arrival", {}).get("estimated", ""),
            "terminal": flight_info.get("departure", {}).get("terminal", ""),
            "gate": flight_info.get("departure", {}).get("gate", ""),
            "delay_minutes": self._calculate_delay(flight_info),
            "baggage_claim": flight_info.get("arrival", {}).get("baggage", "")
        }
        self._enhance_flight_data(flight_data)
        return flight_data
    
    def _enhance_flight_data(self, flight_data: Dict):
        if flight_data["departure_airport"] in self.airport_data:
            flight_data.update({
                "departure_airport_name": self.airport_data[flight_data["departure_airport"]]["name"],
                "departure_city": self.airport_data[flight_data["departure_airport"]]["city"]
            })
        if flight_data["arrival_airport"] in self.airport_data:
            flight_data.update({
                "arrival_airport_name": self.airport_data[flight_data["arrival_airport"]]["name"],
                "arrival_city": self.airport_data[flight_data["arrival_airport"]]["city"]
            })
        
        try:
            dep_str = flight_data["scheduled_departure"]
            arr_str = flight_data["scheduled_arrival"]
            
            if dep_str and arr_str:
                if '+' in dep_str:
                    dep_str = dep_str.split('+')[0]
                if '+' in arr_str:
                    arr_str = arr_str.split('+')[0]
                    
                dep_dt = datetime.fromisoformat(dep_str.replace('Z', ''))
                arr_dt = datetime.fromisoformat(arr_str.replace('Z', ''))
                
                duration = arr_dt - dep_dt
                hours, remainder = divmod(duration.seconds, 3600)
                minutes = remainder // 60
                flight_data["duration"] = f"{hours}h {minutes}m"
            else:
                flight_data["duration"] = "Unknown"
        except Exception as e:
            logger.warning(f"Error calculating duration: {e}")
            flight_data["duration"] = "Unknown"
    
    def _calculate_delay(self, data: Dict) -> int:
        try:
            scheduled_str = data.get("departure", {}).get("scheduled", "")
            estimated_str = data.get("departure", {}).get("estimated", "")
            
            if not scheduled_str or not estimated_str:
                return 0
                
            if '+' in scheduled_str:
                scheduled_str = scheduled_str.split('+')[0]
            if '+' in estimated_str:
                estimated_str = estimated_str.split('+')[0]
                
            scheduled = datetime.fromisoformat(scheduled_str.replace('Z', ''))
            estimated = datetime.fromisoformat(estimated_str.replace('Z', ''))
            
            delay = (estimated - scheduled).total_seconds() / 60
            return max(0, int(delay))
        except Exception as e:
            logger.warning(f"Error calculating delay: {e}")
            return 0
            
    def _generate_mock_data(self, flight_number: str, date: str) -> Dict:
        airline_code = flight_number[:2] if len(flight_number) >= 2 else "AA"
        operator = self.airline_data.get(airline_code, {"name": "Unknown Airline"})["name"]
        airports = list(self.airport_data.keys())
        dep = random.choice(airports)
        arr = random.choice([a for a in airports if a != dep])
        status = random.choice(["Scheduled", "In Flight", "Landed", "Delayed"])
        delay = random.randint(0, 60) if status == "Delayed" else 0
        
        try:
            if date == datetime.now().strftime("%Y-%m-%d"):
                date_obj = datetime.now()
            else:
                year, month, day = date.split('-')
                date_obj = datetime(int(year), int(month), int(day))
        except:
            date_obj = datetime.now()
            
        dep_time = datetime.combine(date_obj.date(), datetime.now().time())
        arr_time = dep_time + timedelta(hours=random.randint(1, 5))
        
        return {
            "flight_number": flight_number,
            "operator": operator,
            "status": status,
            "departure_airport": dep,
            "departure_airport_name": self.airport_data[dep]["name"],
            "departure_city": self.airport_data[dep]["city"],
            "arrival_airport": arr,
            "arrival_airport_name": self.airport_data[arr]["name"],
            "arrival_city": self.airport_data[arr]["city"],
            "scheduled_departure": dep_time.isoformat(),
            "estimated_departure": (dep_time + timedelta(minutes=delay)).isoformat(),
            "scheduled_arrival": arr_time.isoformat(),
            "estimated_arrival": (arr_time + timedelta(minutes=delay)).isoformat(),
            "terminal": random.choice(["A", "B", "C"]),
            "gate": f"G{random.randint(1, 20)}",
            "delay_minutes": delay,
            "baggage_claim": random.choice(["", "B3"]) if status == "Landed" else "",
            "duration": f"{random.randint(1, 5)}h {random.randint(0, 59)}m"
        }


class ContextManager:
    def __init__(self, ttl=900):
        self.context = {}
        self.ttl = timedelta(seconds=ttl)
        self.state = 'initial'
        self.history = deque(maxlen=10)
        
    def update(self, entities: Dict):
        now = datetime.now()
        for k, v in entities.items():
            if v:
                self.context[k] = {'value': v, 'timestamp': now}
        self._clean()
    
    def get(self) -> Dict:
        self._clean()
        return {k: v['value'] for k, v in self.context.items()}
    
    def set_state(self, state: str):
        logger.info(f"State change: {self.state} -> {state}")
        self.state = state
    
    def get_state(self) -> str:
        return self.state
    
    def _clean(self):
        now = datetime.now()
        self.context = {k: v for k, v in self.context.items() if (now - v['timestamp']) < self.ttl}

    def reset(self):
        self.context = {}
        self.state = 'initial'
        self.history.clear()
        return {"status": "context_reset", "message": "Conversation context has been reset."}


class EntityExtractor:
    def __init__(self):
        self.connector = FlightDataConnector(mock_mode=True)
        self.airports = self.connector.airport_data
        self.patterns = {
            'flight_number': r'\b([A-Z]{2,3})\s*(\d{1,4}[A-Z]?)\b',
            'airport_code': r'\b([A-Z]{3})\b',
            'date': r'\b(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4}|today|tomorrow)\b'
        }
    
    def extract_entities(self, text: str) -> Dict:
        if not text:
            return {}
        entities = {}
        text_upper = text.upper()
        
        for key, pattern in self.patterns.items():
            match = re.search(pattern, text_upper)
            if match:
                if key == 'flight_number':
                    entities[key] = f"{match.group(1)}{match.group(2)}"
                elif key == 'airport_code' and match.group(1) in self.airports:
                    entities[key] = match.group(1)
                elif key == 'date':
                    entities[key] = match.group(1)
                    if entities[key] in ['TODAY', 'TOMORROW']:
                        entities[key] = (datetime.now() + timedelta(days=1 if entities[key] == 'TOMORROW' else 0)).strftime('%Y-%m-%d')
        return entities


class ResponseGenerator:
    def __init__(self, intent_manager=None):
        self.intent_manager = intent_manager or IntentManager()
        self.templates = {
            "flight_status": "Flight {flight_number} operated by {operator} from {departure_city} ({departure_airport}) to {arrival_city} ({arrival_airport}) is currently {status}. {additional_info}",
            "delay_info": "Flight {flight_number} is delayed by {delay_minutes} minutes. The updated departure time is {estimated_departure}.",
            "no_delay": "Flight {flight_number} is on schedule.",
            "gate_info": "Flight {flight_number} departs from Gate {gate}, Terminal {terminal}.",
            "generic_error": "I couldn't find that flight. Please provide more details.",
            "ask_flight_number": "Please provide a flight number (like AA123).",
            "default_greeting": "Hello! How can I assist you with your flight today?"
        }
    
    def generate_response(self, message: str, flight_data: Dict = None, intent: str = None) -> str:
        """Generate a text response based on intent and flight data"""
        # Check for specific intent responses first
        if intent:
            intent_response = self.intent_manager.get_response_for_intent(intent)
            if intent_response:
                return intent_response
        
        # Handle greeting specifically
        if intent == "greeting" or message.lower().strip() in ["hello", "hi", "hey", "greetings"]:
            return self.templates.get("default_greeting", "Hello! How can I assist you with your flight today?")
        
        # Handle flight data if available
        if flight_data:
            additional_info = ""
            if flight_data.get('status') == 'Delayed':
                additional_info = f"It's delayed by {flight_data.get('delay_minutes')} minutes."
            elif flight_data.get('gate'):
                additional_info = f"It departs from Gate {flight_data.get('gate')}, Terminal {flight_data.get('terminal')}."
            
            response = self.templates["flight_status"].format(
                additional_info=additional_info,
                **flight_data
            )
            return response
        
        # If no intent matched and no flight data, check if asking about flight status
        if "flight status" in message.lower() or "my flight" in message.lower():
            return self.templates["ask_flight_number"]
        
        # Fallback to generic response
        return self.templates["generic_error"]

class FlightAssistant:
    def __init__(self, api_key=None, mock_mode=True):
        self.connector = FlightDataConnector(api_key, mock_mode)
        self.context_mgr = ContextManager()
        self.entity_extractor = EntityExtractor()
        self.intent_manager = IntentManager()
        self.response_generator = ResponseGenerator(self.intent_manager)
        logger.info("Flight Assistant initialized")
    
    def reset_context(self):
        return self.context_mgr.reset()

        # In the FlightAssistant class, improve the process_message method
    async def process_message(self, message: str) -> Dict:
        logger.info(f"Processing message: {message}")
        
        if not message or message.strip() == "":
            return {
                "text": "I didn't receive any message. How can I help you with your flight?",
                "response": "I didn't receive any message. How can I help you with your flight?",
                "entities": {},
                "flight_data": None,
                "intent": None
            }
        
        entities = self.entity_extractor.extract_entities(message)
        self.context_mgr.update(entities)
        
        # Match intent with improved handling for greetings
        intent = self.intent_manager.match_intent(message)
        
        # Better handling for greetings
        message_lower = message.lower().strip()
        common_greetings = ["hello", "hi", "hey", "greetings", "good day", "what's up", "how are you"]
        if intent is None and any(greeting == message_lower for greeting in common_greetings):
            intent = "greeting"
        
        flight_number = entities.get('flight_number') or self.context_mgr.get().get('flight_number')
        date = entities.get('date') or self.context_mgr.get().get('date')
        
        # Only fetch flight data if intent is not a greeting
        flight_data = None
        if flight_number and intent != "greeting":
            flight_data = await self.connector.get_flight_status(flight_number, date)
            self.context_mgr.set_state('flight_identified')
        
        # Prioritize intent response for greeting
        response_text = None
        if intent == "greeting":
            response_text = self.intent_manager.get_response_for_intent(intent)
            if not response_text:
                response_text = "Hello! How can I assist you with your flight today?"
        
        # If no response from intent, generate response based on flight data
        if not response_text:
            response_text = self.response_generator.generate_response(message, flight_data, intent)
        
        # Return both text response and structured data
        response_data = {
            "text": response_text,  # Plain text response for direct display
            "response": response_text,  # Keep the original 'response' key for backward compatibility
            "entities": entities,
            "flight_data": flight_data,
            "intent": intent
        }
        
        return response_data


app = FastAPI(title="Flight Assistant API")
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

assistant = FlightAssistant(mock_mode=os.environ.get("MOCK_MODE", "true").lower() == "true")

@app.post("/api/message")
async def process_message_endpoint(request: Request) -> Dict:
    try:
        request_data = await request.json()
        message = request_data.get("message", "")
        if not message:
            return JSONResponse(content={"error": "No message provided"}, status_code=400)
        
        response = await assistant.process_message(message)
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"Error processing REST request: {e}", exc_info=True)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info(f"WebSocket connection accepted: {websocket.client}")
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket data: {data}")
            try:
                request_data = json.loads(data)
                message = request_data.get("message")
                if message:
                    response = await assistant.process_message(message)
                    await websocket.send_json(response)
                    logger.debug(f"Sent response: {response}")
                elif request_data.get("action") == "reset":
                    result = assistant.reset_context()
                    await websocket.send_json(result)
                    logger.debug(f"Reset context: {result}")
            except json.JSONDecodeError:
                response = await assistant.process_message(data)
                await websocket.send_json(response)
                logger.debug(f"Sent response for raw message: {response}")
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {websocket.client}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "error": str(e),
                "response": "Sorry, an error occurred while processing your request."
            })
        except:
            pass

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/")
async def root():
    return {
        "message": "Flight Assistant API is running",
        "endpoints": {
            "REST API": "/api/message",
            "WebSocket": "/ws",
            "Health Check": "/health"
        },
        "timestamp": datetime.now().isoformat()
    }

def find_available_port(start_port=8000, max_attempts=5):
    """Try to find an available port starting from start_port"""
    import socket
    
    for port in range(start_port, start_port + max_attempts):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('0.0.0.0', port))
            sock.close()
            return port
        except OSError:
            continue
    
    return start_port

if __name__ == "__main__":
    try:
        port_env = os.environ.get("PORT")
        port = int(port_env) if port_env else None
        
        if not port:
            port = find_available_port()
            
        print(f"Starting Flight Assistant server on port {port}...")
        logger.info(f"Starting server on port {port}")
        
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=port,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Server startup failed: {e}", exc_info=True)
        print(f"Error starting server: {e}")


