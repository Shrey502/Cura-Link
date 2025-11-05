// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion"; // 💡 Added motion
import api from '../api';
import '../App.css';
import { useTheme } from '../context/ThemeContext'; // 💡 Added useTheme
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa'; // 💡 Added icons

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

  // --- 💡 NEW: Canvas, Theme, and Focus/Hover States ---
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSendHover, setIsSendHover] = useState(false);
  const [isBackHover, setIsBackHover] = useState(false);

  // --- 💡 NEW: "Floating Dust" Animation Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const particleCount = 100;

    const getThemeColor = (variable, fallback = '#0ea5e9') => {
      const colorString = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
      return colorString || fallback;
    };

    function Particle(x, y, radius, color, speedX, speedY) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.speedX = speedX;
      this.speedY = speedY;
      this.draw = () => { /* ... */ };
      this.update = () => { /* ... */ };
      
      // (Full particle logic omitted for brevity, it's the same as other pages)
      this.draw = () => {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      };

      this.update = () => {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < -this.radius) this.x = canvas.width + this.radius;
        if (this.x > canvas.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvas.height + this.radius;
        if (this.y > canvas.height + this.radius) this.y = -this.radius;
        this.draw();
      };
    }

    function init() {
      particles = [];
      const particleColor = getThemeColor('--accent-primary');
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 2 + 0.5;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speedX = (Math.random() * 0.4) - 0.2; 
        const speedY = (Math.random() * 0.4) - 0.2;
        particles.push(new Particle(x, y, radius, particleColor, speedX, speedY));
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init();
    };

    resizeCanvas();
    init();
    animate();

    const handleResize = () => {
      resizeCanvas();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  // --- 1. Fetch messages (Unchanged) ---
  useEffect(() => {
    if (!roomId) {
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

  // --- 2. Scroll to bottom (Unchanged) ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 3. Handle sending a new message (Unchanged) ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      const response = await api.post('/chat/messages', {
        roomId: roomId,
        body: newMessage
      });
      const newMsgWithSender = {
        ...response.data,
        sender_id: currentUserId,
        sender_name: user?.full_name || "Me" 
      };
      setMessages([...messages, newMsgWithSender]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message.');
    }
  };

  // --- 💡 NEW: Inline Style Object ---
  const styles = {
    landingCanvas: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1, 
    },
    spinnerContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      background: 'var(--background-primary)',
    },
    // This container centers the chat card
    chatPageContainer: {
      width: '100%',
      padding: '2rem',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center', // Center vertically
    },
    // The main glass card for the chat
    mainCard: {
      width: '100%',
      maxWidth: '800px',
      height: 'calc(100vh - 10rem)', // Make it tall
      padding: '1.5rem 2rem 2rem 2rem',
      background: 'rgba(255, 255, 255, 0.05)', 
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', // Important for layout
    },
    // Header with back button and title
    chatHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--border-glass)',
      flexShrink: 0, // Prevent header from shrinking
    },
    backButton: {
      background: 'transparent',
      border: '1px solid var(--border-glass)',
      color: 'var(--text-secondary)',
      borderRadius: '8px',
      padding: '0.5rem 0.8rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
    },
    backButtonHover: {
      borderColor: 'var(--accent-primary)',
      color: 'var(--accent-primary)',
    },
    // This is the scrolling message area
    chatMessagesArea: {
      flex: 1, // This makes it take all available space
      overflowY: 'auto',
      padding: '1rem 0.5rem 1rem 0', // Add padding for scrollbar
    },
    // Container for each message (for alignment)
    messageContainer: {
      display: 'flex',
      flexDirection: 'column',
      margin: '0.5rem 0',
    },
    messageSentContainer: {
      alignItems: 'flex-end', // Aligns bubble to the right
    },
    messageReceivedContainer: {
      alignItems: 'flex-start', // Aligns bubble to the left
    },
    // The message bubble itself
    messageBubble: {
      padding: '0.75rem 1rem',
      borderRadius: '16px',
      maxWidth: '70%',
      color: 'var(--text-primary)',
      wordWrap: 'break-word',
    },
    messageSent: {
      background: 'var(--accent-primary)',
      color: 'var(--background-primary)', // Text on accent color
      borderBottomRightRadius: '4px',
    },
    messageReceived: {
      background: 'var(--background-primary)', // Darker bubble
      border: '1px solid var(--border-glass)',
      borderBottomLeftRadius: '4px',
    },
    messageMeta: {
      color: 'var(--text-secondary)',
      fontSize: '0.75rem',
      marginTop: '0.3rem',
      padding: '0 0.25rem',
    },
    // Message input form
    form: {
      display: 'flex',
      gap: '0.5rem',
      paddingTop: '1rem',
      borderTop: '1px solid var(--border-glass)',
      flexShrink: 0, // Prevent form from shrinking
    },
    input: {
      flex: 1, // Takes up all space
      padding: '0.75rem 1rem',
      backgroundColor: 'var(--background-primary)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      borderRadius: '8px',
      color: 'var(--text-primary)',
      fontSize: '1rem',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease', 
    },
    inputFocus: {
      borderColor: 'var(--accent-primary)',
      boxShadow: '0 0 10px 0 var(--accent-primary-faded)',
    },
    sendButton: {
      padding: '0 0.75rem',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      width: '50px', // Fixed width
    },
    sendButtonBase: {
      backgroundColor: 'var(--accent-primary)',
      color: 'var(--background-primary)',
    },
    sendButtonHover: {
      backgroundColor: 'var(--accent-primary-dark)',
      transform: 'scale(1.05)',
    },
  };

  // --- 💡 NEW: Dynamic Style Definitions ---
  const backButtonStyle = { ...styles.backButton, ...(isBackHover ? styles.backButtonHover : {}) };
  const inputStyle = { ...styles.input, ...(isInputFocused ? styles.inputFocus : {}) };
  const sendButtonStyle = { ...styles.sendButton, ...styles.sendButtonBase, ...(isSendHover ? styles.sendButtonHover : {}) };

  if (loading) {
    return (
      <div style={styles.spinnerContainer}>
        <canvas ref={canvasRef} style={styles.landingCanvas} />
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <canvas ref={canvasRef} style={styles.landingCanvas} />
      
      <motion.div 
        style={styles.chatPageContainer}
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        <motion.div 
          style={styles.mainCard}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
        >
          {/* --- 💡 Header --- */}
          <div style={styles.chatHeader}>
            <button 
              onClick={() => navigate(-1)} 
              style={backButtonStyle}
              onMouseEnter={() => setIsBackHover(true)}
              onMouseLeave={() => setIsBackHover(false)}
            >
              <FaArrowLeft /> Back
            </button>
            <h2 style={{color: 'var(--text-primary)', margin: 0, textAlign: 'right'}}>
              {roomName}
            </h2>
          </div>

          {/* --- 💡 Message Display Area --- */}
          <div style={styles.chatMessagesArea}>
            {messages.map((msg) => {
              const isSentByMe = msg.sender_id === currentUserId;
              
              const containerStyle = {
                ...styles.messageContainer,
                ...(isSentByMe ? styles.messageSentContainer : styles.messageReceivedContainer)
              };
              
              const bubbleStyle = {
                ...styles.messageBubble,
                ...(isSentByMe ? styles.messageSent : styles.messageReceived)
              };

              return (
                <motion.div 
                  key={msg.id} 
                  style={containerStyle}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={bubbleStyle}>
                    <p style={{margin: 0}}>{msg.body}</p>
                  </div>
                  <small style={styles.messageMeta}>
                    <strong>{isSentByMe ? 'Me' : msg.sender_name}</strong>
                    {' at '}
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </small>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* --- 💡 Message Input Form --- */}
          <form onSubmit={handleSendMessage} style={styles.form}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              style={inputStyle}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            <button 
              type="submit" 
              style={sendButtonStyle}
              onMouseEnter={() => setIsSendHover(true)}
              onMouseLeave={() => setIsSendHover(false)}
            >
              <FaPaperPlane />
            </button>
          </form>
          
        </motion.div>
      </motion.div>
    </>
  );
}

export default ChatPage;