// pages/index.js
import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

// Main App component for the Gemini Chatbot
function App() {
  // State to store chat messages, now using Gemini API's expected format:
  // Each message object will be { role: 'user' | 'model', parts: [{ text: '...' }] }
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
    // Prevent sending empty messages or if already loading
    if (!input.trim() || loading) return;

    // Prepare the new user message in Gemini API format
    const newUserMessage = { role: 'user', parts: [{ text: input }] };
    
    // Add user's message to the chat history immediately for display
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput(''); // Clear the input field
    setLoading(true); // Set loading state to true

    try {
      // Prepare the full chat history to send to the API for context
      // This includes all previous messages + the new user message
      const chatHistoryForAPI = [...messages, newUserMessage];

      // Make a POST request to the Next.js API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the entire chat history for context to the backend
        body: JSON.stringify({ history: chatHistoryForAPI }),
      });

      // Check if the response was successful
      if (!response.ok) {
        // Attempt to parse error data for more specific message
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menghubungi server.');
      }

      const data = await response.json();
      // Add the bot's reply to the chat history
      // The reply from the API should already be in the correct { role: 'model', parts: [{ text: '...' }] } format
      if (data.reply) {
        setMessages((prevMessages) => [...prevMessages, data.reply]);
      } else {
        throw new Error('Tidak ada balasan yang valid dari AI.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Display a user-friendly error message if something goes wrong
      setMessages((prevMessages) => [...prevMessages, { role: 'model', parts: [{ text: 'Oops! Ada kesalahan. Silakan coba lagi.' }] }]);
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
              Mulai percakapan dengan AC-Komputer AI!
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              // Adjust alignment based on role (user or model)
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {/* Render Markdown for bot messages, display plain text for user messages */}
                {msg.role === 'model' && msg.parts && msg.parts.length > 0 ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed" // <--- KELAS INI DITAMBAHKAN
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.parts[0].text) }}
                  />
                ) : (
                  msg.parts && msg.parts.length > 0 && msg.parts[0].text
                )}
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
            // Changed onKeyDown to onKeyPress for better compatibility with 'Enter' key
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ketik pesan Anda..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="ml-3 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {/* SVG for the arrow icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
