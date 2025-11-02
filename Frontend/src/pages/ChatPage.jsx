// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import '../App.css'; // Use existing styles

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  // Get room info from the navigation state
  const { roomId, roomName } = location.state || {};

  // Get the current user's ID from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const currentUserId = user?.id;

  // --- 1. Fetch messages when the page loads ---
  useEffect(() => {
    if (!roomId) {
      // If we don't have a room, go back to the dashboard
      navigate('/dashboard/researcher');
      return;
    }
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/chat/messages/${roomId}`);
        setMessages(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch messages', err);
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId, navigate]);

  // --- 2. Scroll to bottom when new messages appear ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 3. Handle sending a new message ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      // Send the message to the backend
      const response = await api.post('/chat/messages', {
        roomId: roomId,
        body: newMessage
      });
      
      // Manually add sender_name for instant UI update
      const newMsgWithSender = {
        ...response.data,
        sender_id: currentUserId, // We know we are the sender
        sender_name: user?.full_name || "Me" 
      };

      setMessages([...messages, newMsgWithSender]);
      setNewMessage(''); // Clear the input
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message.');
    }
  };

  if (loading) return <div>Loading chat...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Chat with {roomName}</h2>

      {/* --- Message Display Area --- */}
      <div className="chat-messages-area">
        {messages.map((msg) => {
          // Check if the message was sent by the current user
          const isSentByMe = msg.sender_id === currentUserId;
          
          return (
            <div 
              key={msg.id} 
              // Set container class to 'sent' or 'received'
              className={`chat-message-container ${isSentByMe ? 'sent' : 'received'}`}
            >
              <div 
                // Set message class to 'sent' or 'received'
                className={`chat-message ${isSentByMe ? 'sent' : 'received'}`}
              >
                <p>{msg.body}</p>
                <small>
                  <strong>{isSentByMe ? 'Me' : msg.sender_name}</strong>
                  {' at '}
                  {new Date(msg.created_at).toLocaleTimeString()}
                </small>
              </div>
            </div>
          );
        })}
        {/* Empty div to auto-scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', marginTop: '1rem' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, marginRight: '0.5rem' }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatPage;

