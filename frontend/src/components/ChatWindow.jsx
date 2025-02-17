import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const ChatWindow = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="flex justify-between items-center p-4 bg-gray-600 text-white">
            <h3 className="font-semibold">Chat Support</h3>
            <button 
              onClick={toggleChat}
              className="p-1 hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe
            src="/Chatbot/templates/index.html"
            className="w-full h-[calc(100%-56px)]"
            frameBorder="0"
            title="Chat Support"
          />
        </div>
      )}
      
      <button 
        onClick={toggleChat}
        className="bg-gray-600 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ChatWindow;