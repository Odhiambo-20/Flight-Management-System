import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const ChatWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const messagesEndRef = useRef(null);

  // WebSocket configuration
  const WS_URL = 'ws://localhost:5000/ws';
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 3000;

  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      closeWebSocket();
    }
    return () => closeWebSocket();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    closeWebSocket(); // Clean up any existing connection
    setConnectionStatus('connecting');

    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts.current = 0;
      setConnectionStatus('connected');
      addSystemMessage('Connected to flight assistant');
    };

    wsRef.current.onmessage = (event) => {
      try {
        // Log the raw message for debugging
        console.log('Raw WebSocket message:', event.data);
        
        const response = JSON.parse(event.data);
        console.log('Parsed response:', response);
        
        // Extract the text and flight data more flexibly
        const messageText = response.response || response.message || response.text || 
                           (typeof response === 'string' ? response : 'No message text');
        
        const flightData = response.flight_data || response.flights || response.data || null;
        
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          text: messageText,
          data: flightData
        }]);
      } catch (error) {
        console.error('Error parsing message:', error);
        // If JSON parsing fails, try to display the raw message
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          text: typeof event.data === 'string' ? event.data : 'Received non-text response',
          data: null
        }]);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (isOpen && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect();
      }
    };
  };

  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const scheduleReconnect = () => {
    reconnectAttempts.current++;
    setConnectionStatus(`reconnecting (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
    
    setTimeout(() => {
      if (isOpen && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
        connectWebSocket();
      }
    }, RECONNECT_INTERVAL);
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { type: 'system', text }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setMessages([]);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = inputValue.trim();
    if (!message || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Add user message immediately
    setMessages(prev => [...prev, { type: 'user', text: message }]);
    
    try {
      wsRef.current.send(JSON.stringify({ message }));
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
      addSystemMessage('Failed to send message. Please try again.');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Updated renderFlightData function to handle the specific JSON structure
  const renderFlightData = (data) => {
    if (!data || Object.keys(data).length === 0) return null;
    
    // Handle the availableFlights array inside flight_data
    if (data.availableFlights && Array.isArray(data.availableFlights)) {
      const flights = data.availableFlights;
      return (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="font-semibold text-xs mb-1">Available Flights:</div>
          <div className="max-h-40 overflow-y-auto">
            {flights.map((flight, idx) => {
              // Format dates to be human-readable
              const departureTime = flight.departureTime ? new Date(flight.departureTime).toLocaleString() : 'N/A';
              const arrivalTime = flight.arrivalTime ? new Date(flight.arrivalTime).toLocaleString() : 'N/A';
              
              return (
                <div key={idx} className="p-2 mb-1 bg-gray-100 rounded text-xs">
                  <div className="font-medium">{flight.flightNumber || 'Flight'}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>From: {flight.from || 'N/A'}</div>
                    <div>To: {flight.to || 'N/A'}</div>
                    <div>Departure: {departureTime}</div>
                    <div>Arrival: {arrivalTime}</div>
                    <div>Available Seats: {flight.availableSeats || 'N/A'}</div>
                    <div>Price: ${flight.price || 'N/A'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // For a single flight detail object
    if (data.flightNumber || data.flight_number) {
      const flightNo = data.flightNumber || data.flight_number;
      const from = data.from || data.departure;
      const to = data.to || data.arrival;
      const departureTime = data.departureTime || data.departure_time;
      const formattedDeparture = departureTime ? new Date(departureTime).toLocaleString() : 'N/A';
      
      return (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="font-semibold text-xs mb-1">Flight Details:</div>
          <div className="p-2 bg-gray-100 rounded text-xs">
            <div className="font-medium">{flightNo}</div>
            <div className="grid grid-cols-2 gap-1">
              <div>From: {from || 'N/A'}</div>
              <div>To: {to || 'N/A'}</div>
              <div>Departure: {formattedDeparture}</div>
              {data.arrivalTime && <div>Arrival: {new Date(data.arrivalTime).toLocaleString()}</div>}
              {data.availableSeats && <div>Available Seats: {data.availableSeats}</div>}
              {data.price && <div>Price: ${data.price}</div>}
              {data.gate && <div>Gate: {data.gate}</div>}
              {data.status && <div>Status: {data.status}</div>}
              {data.delay && <div>Delay: {data.delay} minutes</div>}
            </div>
          </div>
        </div>
      );
    }
    
    // Support for other flight data formats - like arrays directly at the top level
    if (Array.isArray(data)) {
      return (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="font-semibold text-xs mb-1">Available Flights:</div>
          <div className="max-h-40 overflow-y-auto">
            {data.map((flight, idx) => (
              <div key={idx} className="p-2 mb-1 bg-gray-100 rounded text-xs">
                <div className="font-medium">{flight.flightNumber || flight.flight_number || 'Flight'}</div>
                <div className="grid grid-cols-2 gap-1">
                  <div>From: {flight.from || flight.departure || 'N/A'}</div>
                  <div>To: {flight.to || flight.arrival || 'N/A'}</div>
                  {flight.departureTime && <div>Departure: {new Date(flight.departureTime).toLocaleString()}</div>}
                  {flight.arrivalTime && <div>Arrival: {new Date(flight.arrivalTime).toLocaleString()}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Fallback for any other data structure
    return (
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
        <div className="font-semibold mb-1">Flight Data:</div>
        <div className="bg-gray-100 p-2 rounded overflow-x-auto">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
          <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
            <div>
              <h3 className="font-semibold">Flight Assistant</h3>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span>{connectionStatus}</span>
              </div>
            </div>
            <button 
              onClick={toggleChat}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.type === 'system'
                      ? 'bg-gray-300 text-gray-800'
                      : 'bg-white text-gray-800 shadow-md'
                  }`}
                >
                  <div className="font-medium mb-1">
                    {msg.type === 'user' ? 'You' : 'Flight Assistant'}
                  </div>
                  <div>{msg.text}</div>
                  {msg.data && renderFlightData(msg.data)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={
                  connectionStatus.startsWith('connected') 
                    ? "Ask about flight status..." 
                    : "Connecting..."
                }
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={!connectionStatus.startsWith('connected')}
              />
              <button
                type="submit"
                className={`p-2 rounded-lg transition-colors ${
                  connectionStatus.startsWith('connected')
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!connectionStatus.startsWith('connected')}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={toggleChat}
        className={`p-4 rounded-full shadow-lg transition-all ${
          isOpen ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

export default ChatWindow;