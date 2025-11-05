// src/pages/ResearcherDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import api from '../api';
import ContactModal from '../components/ContactModal';
import { useTheme } from '../context/ThemeContext';
import '../App.css';

// --- SessionStorage Keys (Unchanged) ---
const SESSION_KEYS = {
  COLLAB_SEARCH_TERM: 'rd_collabSearchTerm',
  COLLABORATORS: 'rd_collaborators',
  CATEGORIES: 'rd_categories',
  SELECTED_CATEGORY: 'rd_selectedCategory',
  POSTS: 'rd_posts',
  SELECTED_POST: 'rd_selectedPost',
  REPLIES: 'rd_replies',
  PENDING_REQUESTS: 'rd_pendingRequests',
  ACCEPTED_COLLABS: 'rd_acceptedCollabs',
  SENT_REQUESTS: 'rd_sentRequests',
  PENDING_MEETINGS: 'rd_pendingMeetings'
};

// --- Helper: get state from sessionStorage (Unchanged) ---
const getInitialState = (key, defaultValue) => {
  const storedValue = sessionStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue);
    } catch (e) {
      console.error(`Failed to parse sessionStorage key "${key}":`, e);
      return defaultValue;
    }
  }
  return defaultValue;
};

function ResearcherDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Forum State (Unchanged) ---
  const [categories, setCategories] = useState(() => getInitialState(SESSION_KEYS.CATEGORIES, []));
  const [selectedCategory, setSelectedCategory] = useState(() => getInitialState(SESSION_KEYS.SELECTED_CATEGORY, null));
  const [posts, setPosts] = useState(() => getInitialState(SESSION_KEYS.POSTS, []));
  const [selectedPost, setSelectedPost] = useState(() => getInitialState(SESSION_KEYS.SELECTED_POST, null));
  const [replies, setReplies] = useState(() => getInitialState(SESSION_KEYS.REPLIES, []));
  const [replyBody, setReplyBody] = useState('');

  // --- Create Category State (Unchanged) ---
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // --- Meeting Request State (Unchanged) ---
  const [pendingMeetings, setPendingMeetings] = useState(() => getInitialState(SESSION_KEYS.PENDING_MEETINGS, []));

  // --- Collaborator State (Unchanged) ---
  const [collabSearchTerm, setCollabSearchTerm] = useState(() => getInitialState(SESSION_KEYS.COLLAB_SEARCH_TERM, ''));
  const [collaborators, setCollaborators] = useState(() => getInitialState(SESSION_KEYS.COLLABORATORS, []));

  // --- Connection & Chat State (Unchanged) ---
  const [pendingRequests, setPendingRequests] = useState(() => getInitialState(SESSION_KEYS.PENDING_REQUESTS, []));
  const [acceptedCollabs, setAcceptedCollabs] = useState(() => getInitialState(SESSION_KEYS.ACCEPTED_COLLABS, []));
  const [sentRequests, setSentRequests] = useState(() => getInitialState(SESSION_KEYS.SENT_REQUESTS, []));
  const [toastMessage, setToastMessage] = useState('');
  const [connectRequest, setConnectRequest] = useState(null);

  // --- Canvas, Theme, and Focus States ---
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const [collabSearchFocused, setCollabSearchFocused] = useState(false);
  const [catNameFocused, setCatNameFocused] = useState(false);
  const [catDescFocused, setCatDescFocused] = useState(false);
  const [replyBodyFocused, setReplyBodyFocused] = useState(false);

  // --- "Floating Dust" Animation Logic ---
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


  // --- Fetch ALL data on page load (Unchanged) ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/researcher');
        setProfile(response.data.profile);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Could not fetch your profile.');
      }
    };
    const fetchCategories = async () => {
      if (categories.length > 0 && sessionStorage.getItem(SESSION_KEYS.CATEGORIES)) return;
      try {
        const response = await api.get('/forums');
        setCategories(response.data);
        sessionStorage.setItem(SESSION_KEYS.CATEGORIES, JSON.stringify(response.data));
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    const fetchConnections = async () => {
      try {
        const [pendingRes, acceptedRes] = await Promise.all([
          api.get('/connections/pending'),
          api.get('/connections/accepted')
        ]);
        setPendingRequests(pendingRes.data);
        sessionStorage.setItem(SESSION_KEYS.PENDING_REQUESTS, JSON.stringify(pendingRes.data));
        setAcceptedCollabs(acceptedRes.data);
        sessionStorage.setItem(SESSION_KEYS.ACCEPTED_COLLABS, JSON.stringify(acceptedRes.data));
      } catch (err) {
        console.error('Failed to fetch connections', err);
      }
    };
    const fetchMeetingRequests = async () => {
      try {
        const response = await api.get('/meetings/pending');
        setPendingMeetings(response.data);
        sessionStorage.setItem(SESSION_KEYS.PENDING_MEETINGS, JSON.stringify(response.data));
      } catch (err) {
        console.error('Failed to fetch meeting requests', err);
      }
    };
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchCategories(),
        fetchConnections(),
        fetchMeetingRequests()
      ]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  // --- All Handlers (Unchanged) ---
  const handleCategoryClick = async (categoryId) => {
    setSelectedCategory(categoryId);
    sessionStorage.setItem(SESSION_KEYS.SELECTED_CATEGORY, JSON.stringify(categoryId));
    setSelectedPost(null);
    sessionStorage.removeItem(SESSION_KEYS.SELECTED_POST);
    setReplies([]);
    sessionStorage.removeItem(SESSION_KEYS.REPLIES);
    try {
      const response = await api.get(`/forums/posts/${categoryId}`);
      setPosts(response.data);
      sessionStorage.setItem(SESSION_KEYS.POSTS, JSON.stringify(response.data));
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };
  const handlePostClick = async (postId) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
      sessionStorage.removeItem(SESSION_KEYS.SELECTED_POST);
      setReplies([]);
      sessionStorage.removeItem(SESSION_KEYS.REPLIES);
    } else {
      setSelectedPost(postId);
      sessionStorage.setItem(SESSION_KEYS.SELECTED_POST, JSON.stringify(postId));
      try {
        const response = await api.get(`/forums/replies/${postId}`);
        setReplies(response.data);
        sessionStorage.setItem(SESSION_KEYS.REPLIES, JSON.stringify(response.data));
      } catch (err) {
        console.error('Failed to fetch replies', err);
      }
    }
  };
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/forums/replies', {
        body: replyBody,
        postId: selectedPost,
      });
      const newReplies = [...replies, response.data];
      setReplies(newReplies);
      sessionStorage.setItem(SESSION_KEYS.REPLIES, JSON.stringify(newReplies));
      setReplyBody('');
    } catch (err) {
      console.error('Failed to post reply', err);
    }
  };
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName || !newCategoryDesc) {
      setError('Please fill out both name and description.');
      return;
    }
    try {
      const response = await api.post('/forums/categories', {
        name: newCategoryName,
        description: newCategoryDesc
      });
      const newCategories = [...categories, response.data];
      setCategories(newCategories);
      sessionStorage.setItem(SESSION_KEYS.CATEGORIES, JSON.stringify(newCategories));
      setNewCategoryName('');
      setNewCategoryDesc('');
      setError('');
    } catch (err) {
      console.error('Failed to create category', err);
      setError('Failed to create category. Please try again.');
    }
  };
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 1500);
  };
  const handleCollabSearchTermChange = (e) => {
    setCollabSearchTerm(e.target.value);
    sessionStorage.setItem(SESSION_KEYS.COLLAB_SEARCH_TERM, JSON.stringify(e.target.value));
  };
  const handleSearchCollaborators = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/experts', { searchTerm: collabSearchTerm });
      const myCollabIds = acceptedCollabs.map(c => c.collaborator_id);
      const otherResearchers = response.data.filter(
        r => r.user_id !== profile?.user_id && !myCollabIds.includes(r.user_id)
      );
      setCollaborators(otherResearchers);
      sessionStorage.setItem(SESSION_KEYS.COLLABORATORS, JSON.stringify(otherResearchers));
    } catch (err) {
      console.error('Collaborator search failed', err);
      setError('Search for collaborators failed.');
    }
  };
  const handleFavorite = async (itemId) => {
    try {
      await api.post('/favorites', { itemId, itemType: 'EXPERT' });
      showToast('Added to favorites!');
    } catch (err) {
      console.error('Failed to add favorite', err);
      if (err.response && err.response.status === 409) {
        showToast('Item is already in your favorites.');
      } else {
        showToast('Could not add to favorites.');
      }
    }
  };
  const handleConnectRequest = (researcherName, researcherId) => {
    setConnectRequest({ name: researcherName, id: researcherId });
  };
  const confirmConnectRequest = async () => {
    try {
      await api.post('/connections/request', { recipientId: connectRequest.id });
      showToast(`Connection request sent to ${connectRequest.name}!`);
      const newSentRequests = [...sentRequests, connectRequest.id];
      setSentRequests(newSentRequests);
      sessionStorage.setItem(SESSION_KEYS.SENT_REQUESTS, JSON.stringify(newSentRequests));
    } catch (err) {
      console.error('Failed to send request', err);
      if (err.response && err.response.status === 409) {
        showToast('Request already sent.');
      } else {
        showToast('Failed to send request.');
      }
    } finally {
      setConnectRequest(null);
    }
  };
  const handleRequestResponse = async (requestId, response) => {
    try {
      await api.put('/connections/respond', { requestId, response });
      const newPending = pendingRequests.filter(req => req.id !== requestId);
      setPendingRequests(newPending);
      sessionStorage.setItem(SESSION_KEYS.PENDING_REQUESTS, JSON.stringify(newPending));
      if (response === 'ACCEPTED') {
        const acceptedRes = await api.get('/connections/accepted');
        setAcceptedCollabs(acceptedRes.data);
        sessionStorage.setItem(SESSION_KEYS.ACCEPTED_COLLABS, JSON.stringify(acceptedRes.data));
      }
      showToast(`Request ${response.toLowerCase()}.`);
    } catch (err) {
      console.error('Failed to respond to request', err);
      showToast('Failed to respond to request.');
    }
  };
  const handleStartChat = async (collaboratorId, collaboratorName) => {
    try {
      const response = await api.post('/chat/rooms', { otherUserId: collaboratorId });
      const room = response.data;
      navigate('/chat', { state: { roomId: room.id, roomName: collaboratorName } });
    } catch (err) {
      console.error('Failed to start chat', err);
      showToast('Could not start chat.');
    }
  };
  const handleMeetingResponse = async (requestId, response) => {
    try {
      await api.put('/meetings/respond', { requestId, response });
      const newPending = pendingMeetings.filter(req => req.id !== requestId);
      setPendingMeetings(newPending);
      sessionStorage.setItem(SESSION_KEYS.PENDING_MEETINGS, JSON.stringify(newPending));
      showToast(`Meeting ${response.toLowerCase()}.`);
    } catch (err) {
      console.error('Failed to respond to meeting', err);
      showToast('Failed to respond.');
    }
  };

  // --- 💡 UPDATED Inline Style Object ---
  const styles = {
    landingCanvas: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1, 
    },
    column: {
      flex: 1,
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.05)', 
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      
      // 💡 FIXED: Changed 10rem to 13rem to make cards smaller
      maxHeight: 'calc(100vh - 13rem)', 
      overflowY: 'auto',
    },
    formGroup: {
      marginBottom: '1.5rem',
      textAlign: 'left',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: 'var(--text-secondary)',
      fontSize: '0.9rem',
      fontWeight: '500',
    },
    input: {
      width: '100%',
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
    textarea: {
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: 'var(--background-primary)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      borderRadius: '8px',
      color: 'var(--text-primary)',
      fontSize: '1rem',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      minHeight: '120px', 
      fontFamily: 'inherit',
    },
    textareaFocus: {
      borderColor: 'var(--accent-primary)',
      boxShadow: '0 0 10px 0 var(--accent-primary-faded)',
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
    }
  };

  // --- Dynamic styles for inputs (Unchanged) ---
  const collabSearchStyle = { ...styles.input, ...(collabSearchFocused ? styles.inputFocus : {}) };
  const catNameStyle = { ...styles.input, ...(catNameFocused ? styles.inputFocus : {}) };
  const catDescStyle = { ...styles.input, ...(catDescFocused ? styles.inputFocus : {}) };
  const replyBodyStyle = { ...styles.textarea, ...(replyBodyFocused ? styles.textareaFocus : {}) };


  if (loading || !profile) {
    return (
      <div style={styles.spinnerContainer}>
        <canvas ref={canvasRef} style={styles.landingCanvas} />
        <div className="spinner" />
      </div>
    );
  }

  // --- JSX Return (No logic changes) ---
  return (
    <>
      <canvas ref={canvasRef} style={styles.landingCanvas} />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="toast-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="toast-box"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
            >
              {toastMessage}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {connectRequest && (
        <ContactModal
          title="Send Connection Request"
          message={`Are you sure you want to send a connection request to ${connectRequest.name}?`}
          onConfirm={confirmConnectRequest}
          onCancel={() => setConnectRequest(null)}
        />
      )}

      <motion.div
        className="dashboard" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55 }}
      >
        {/* --- Left Column --- */}
        <motion.div
          style={styles.column} 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
        >
          <h2>Welcome, {profile.full_name}</h2>
          <p>Your specialties: <strong>{profile.specialties?.join(', ')}</strong></p>

          <div className="search-box" style={{ marginTop: '2rem' }}>
            <h3>Pending Meeting Requests</h3>
            {pendingMeetings.length === 0 ? (
              <p>No new meeting requests.</p>
            ) : (
              pendingMeetings.map(req => (
                <div key={req.id} className="result-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    <strong>{req.patient_name}</strong> 
                    {req.age && ` (Age ${req.age})`} 
                    {req.conditions && ` - ${req.conditions.join(', ')}`}
                    {req.location && ` - ${req.location}`}
                    &nbsp;has requested a meeting.
                  </span>
                  <div>
                    <button onClick={() => handleMeetingResponse(req.id, 'ACCEPTED')} className="btn btn-success">Accept</button>
                    <button onClick={() => handleMeetingResponse(req.id, 'REJECTED')} className="btn btn-danger" style={{ marginLeft: '0.5rem' }}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="search-box" style={{ marginTop: '2rem' }}>
            <h3>Pending Connection Requests</h3>
            {pendingRequests.length === 0 ? (
              <p>No new requests.</p>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="result-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><strong>{req.requester_name}</strong> wants to connect.</span>
                  <div>
                    <button onClick={() => handleRequestResponse(req.id, 'ACCEPTED')} className="btn btn-success">Accept</button>
                    <button onClick={() => handleRequestResponse(req.id, 'REJECTED')} className="btn btn-danger" style={{ marginLeft: '0.5rem' }}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="search-box" style={{ marginTop: '2rem' }}>
            <h3>Search Collaborators</h3>
            <form onSubmit={handleSearchCollaborators}>
              <input
                type="text"
                placeholder="e.g., Oncology"
                value={collabSearchTerm}
                onChange={handleCollabSearchTermChange}
                style={collabSearchStyle}
                onFocus={() => setCollabSearchFocused(true)}
                onBlur={() => setCollabSearchFocused(false)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
          </div>

          {error && <p className="error-message">{error}</p>}
          <hr style={{ margin: '2rem 0' }} />

          <h3>Forum Management</h3>
          <form onSubmit={handleCreateCategory} style={{ padding: 0, border: 'none', boxShadow: 'none', background: 'none' }}>
            <h4>Create New Category</h4>
            
            <div style={styles.formGroup}>
              <label htmlFor="cat-name" style={styles.label}>Category Name</label>
              <input
                id="cat-name"
                type="text"
                placeholder="e.g., Cardiology Research"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                style={catNameStyle}
                onFocus={() => setCatNameFocused(true)}
                onBlur={() => setCatNameFocused(false)}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="cat-desc" style={styles.label}>Description</label>
              <input
                id="cat-desc"
                type="text"
                placeholder="A short description..."
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                required
                style={catDescStyle}
                onFocus={() => setCatDescFocused(true)}
                onBlur={() => setCatDescFocused(false)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Category</button>
          </form>

          <h4 style={{ marginTop: '1.5rem' }}>Categories</h4>
          <div>
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>

          <h4 style={{ marginTop: '1.5rem' }}>Patient Questions</h4>
          <div>
            {posts.length > 0 ? (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="result-item"
                  style={{ cursor: 'pointer', background: selectedPost === post.id ? 'var(--bg-secondary)' : 'var(--bg-card)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <strong>{post.title}</strong>
                  <br />
                  <small>Asked by: {post.full_name}</small>
                </motion.div>
              ))
            ) : (
              <p>{selectedCategory ? 'No questions in this category yet.' : 'Select a category to see questions.'}</p>
            )}
          </div>
        </motion.div>

        {/* --- Right Column --- */}
        <motion.div
          style={styles.column}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
        >
          <h3>My Collaborators</h3>

          {acceptedCollabs?.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                width: '100%',
              }}>
              {acceptedCollabs.map((collab) => (
                <motion.div
                  key={collab.collaborator_id}
                  className="result-item"
                  whileHover={{ scale: 1.02 }}
                  style={{
                    flex: '1 1 45%',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    padding: '1rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {collab.collaborator_name}
                  </h4>
                  <button
                    onClick={() => handleStartChat(collab.collaborator_id, collab.collaborator_name)}
                    className="btn btn-primary chat-btn"
                  >
                    Chat
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p>No collaborators yet. Find them in the search below.</p>
          )}
          <hr style={{ margin: '2rem 0' }} />

          <h3>Collaborator Search Results</h3>
          {collaborators?.length > 0 ? (
            collaborators.map((expert) => (
              <motion.div key={expert.user_id} className="result-item" whileHover={{ scale: 1.02 }}>
                <h4>{expert.full_name}</h4>
                <p><strong>Specialties:</strong> {expert.specialties?.join(', ')}</p>
                <p><strong>Interests:</strong> {expert.research_interests?.join(', ')}</p>
                <button
                  onClick={() => handleFavorite(expert.user_id)}
                  className="btn btn-secondary"
                >
                  + Favorite
                </button>
                {sentRequests.includes(expert.user_id) ? (
                  <button className="btn btn-secondary" disabled style={{ marginLeft: '0.5rem' }}>
                    Request Sent
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectRequest(expert.full_name, expert.user_id)}
                    className="btn btn-primary"
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Connect
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <p>No collaborators found. Try a new search.</p>
          )}

          <hr style={{ margin: '2rem 0' }} />

          <h3>Question & Answers</h3>
          {!selectedPost && <p>Select a question to see the discussion.</p>}

          {selectedPost && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h4>{posts.find(p => p.id === selectedPost)?.title}</h4>
              <p style={{ fontStyle: 'italic' }}>
                "{posts.find(p => p.id === selectedPost)?.body}"
              </p>
              <hr />
              {replies.length > 0 ? (
                replies.map((reply) => (
                  <div key={reply.id} className="result-item" style={{ background: 'var(--bg-secondary)' }}>
                    <p>{reply.body}</p>
                    <small>Answered by: {reply.full_name}</small>
                  </div>
                ))
              ) : (
                <p>No answers yet. Be the first to reply!</p>
              )}

              <form onSubmit={handleReplySubmit} style={{ marginTop: '1.5rem' }}>
                <h4>Your Answer</h4>
                
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows="5"
                  required
                  style={replyBodyStyle}
                  onFocus={() => setReplyBodyFocused(true)}
                  onBlur={() => setReplyBodyFocused(false)}
                />
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Post Reply
                </button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

export default ResearcherDashboard;