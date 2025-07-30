// pages/index.js
import React, { useState, useEffect, useRef } from 'react';

// Main App component for the Gemini Chatbot
function App() {
  // State to store chat messages
  const [messages, setMessages] = useState([]);
  // State for the current input message
  const [input, setInput] = useState('');
  // State to indicate if a message is being processed
  const [loading, setLoading] = useState(false);
  // Ref for auto-scrolling to the latest message
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the chat window whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to send a message to the chatbot
  const sendMessage = async () => {
    // Prevent sending empty messages
    if (!input.trim()) return;

    // Add user's message to the chat history
    const newMessage = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput(''); // Clear the input field
    setLoading(true); // Set loading state to true

    try {
      // Make a POST request to the Next.js API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage.text }), // Send the user's message
      });

      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong with the API call.');
      }

      const data = await response.json();
      // Add the bot's reply to the chat history
      setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: data.reply }]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Display an error message if something goes wrong
      setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: 'Oops! Ada kesalahan. Silakan coba lagi.' }]);
    } finally {
      setLoading(false); // Set loading state back to false
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-lg flex flex-col h-[80vh]">
        {/* Chat Header */}
        <div className="bg-blue-600 text-white p-4 text-center text-2xl font-bold rounded-t-xl">
          AC-Komputer AI
        </div>

        {/* Message Display Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              Mulai percakapan dengan Gemini!
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[75%] p-3 rounded-lg shadow-md bg-gray-200 text-gray-800 rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ketik pesan Anda..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="ml-3 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
