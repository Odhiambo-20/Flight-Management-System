from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from datetime import datetime
import os
import logging
from typing import Dict
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai import GenerativeModel

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Configure SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    async_mode='threading'
)

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatBot:
    def __init__(self, 
                 api_key: str,
                 model: str = "gemini-1.5-pro",
                 max_history: int = 10):
        genai.configure(api_key=api_key)
        self.model = GenerativeModel(model)
        self.max_history = max_history
        self.chat = self.model.start_chat(history=[])
        self.system_message = """You are Lewinsky, an intelligent airport assistant. You are friendly, professional, 
        and knowledgeable about all airport-related matters including flights, check-in, security, facilities, 
        and transportation. Always introduce yourself as Lewinsky when greeting users."""
        
        # Send system message
        self.chat.send_message(self.system_message)

    def get_bot_response(self, user_message: str) -> str:
        try:
            response = self.chat.send_message(user_message)
            return response.text
        except Exception as e:
            logger.error(f"Error getting bot response: {str(e)}")
            return "I apologize, but I'm having trouble processing your request. Please try again."

# Initialize chatbot
chatbot = ChatBot(
    api_key=os.getenv('GOOGLE_API_KEY')
)

@app.route('/')
def home():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    logger.info("Client connected")
    emit('bot_response', {
        'message': "Hello! I'm Lewinsky, your airport assistant. How can I help you today?",
        'timestamp': datetime.now().strftime("%H:%M")
    })

@socketio.on('user_message')
def handle_message(data: Dict[str, str]) -> None:
    try:
        user_message = data['message']
        logger.info(f"Received message: {user_message}")
        
        bot_response = chatbot.get_bot_response(user_message)
        
        emit('bot_response', {
            'message': bot_response,
            'timestamp': datetime.now().strftime("%H:%M")
        })

    except Exception as e:
        logger.error(f"Error in handle_message: {str(e)}")
        emit('bot_response', {
            'message': "I apologize, but I'm having trouble processing your request. Please try again.",
            'timestamp': datetime.now().strftime("%H:%M")
        })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='127.0.0.1', port=port, debug=True, allow_unsafe_werkzeug=True)