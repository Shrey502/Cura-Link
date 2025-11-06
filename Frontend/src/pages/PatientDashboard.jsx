// src/pages/PatientDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import api from '../api';
import ContactModal from '../components/ContactModal';
import { useTheme } from '../context/ThemeContext';

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Search & Trial State
  const [pubSearchTerm, setPubSearchTerm] = useState('');
  const [trialSearchTerm, setTrialSearchTerm] = useState('');
  const [publications, setPublications] = useState([]);
  const [trials, setTrials] = useState([]);
  const [trialStatusFilter, setTrialStatusFilter] = useState('ALL');
  const [expertSearchTerm, setExpertSearchTerm] = useState('');
  const [experts, setExperts] = useState([]);

  // Forum State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');

  // Request State
  const [toastMessage, setToastMessage] = useState('');
  const [meetingRequest, setMeetingRequest] = useState(null);
  const [meetingUpdates, setMeetingUpdates] = useState([]);
  
  // NEW: Canvas, Theme, and Focus/Hover States
  const canvasRef = useRef(null);
  const { theme } = useTheme(); // Assuming ThemeContext provides 'theme'
  const [pubSearchFocused, setPubSearchFocused] = useState(false);
  const [trialSearchFocused, setTrialSearchFocused] = useState(false);
  const [expertSearchFocused, setExpertSearchFocused] = useState(false);
  const [postTitleFocused, setPostTitleFocused] = useState(false);
  const [postBodyFocused, setPostBodyFocused] = useState(false);
  const [statusFocused, setStatusFocused] = useState(false);

  // Button Hover States
  const [pubSearchHover, setPubSearchHover] = useState(false);
  const [trialSearchHover, setTrialSearchHover] = useState(false);
  const [expertSearchHover, setExpertSearchHover] = useState(false);
  const [postSubmitHover, setPostSubmitHover] = useState(false);

  // Floating Dust Animation Logic
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
      this.x = x; this.y = y; this.radius = radius; this.color = color;
      this.speedX = speedX; this.speedY = speedY;
      this.draw = () => { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill(); };
      this.update = () => {
        this.x += this.speedX; this.y += this.speedY;
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


  // Data Fetching
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/patient');
        setProfile(response.data.profile);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Could not fetch your profile.');
      }
    };
    const fetchCategories = async () => {
      try {
        const response = await api.get('/forums');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    const fetchMeetingUpdates = async () => {
      try {
        const response = await api.get('/meetings/updates');
        setMeetingUpdates(response.data);
      } catch (err) {
        console.error('Failed to fetch meeting updates', err);
      }
    };
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchCategories(), fetchMeetingUpdates()]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  // Handlers
  const handleSearchPublications = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/publications', { searchTerm: pubSearchTerm });
      setPublications(response.data);
    } catch (err) {
      console.error('Search failed', err);
      setError('Search for publications failed.');
    }
  };
  const handleSearchTrials = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/trials', { searchTerm: trialSearchTerm, statusFilter: trialStatusFilter });
      setTrials(response.data);
    } catch (err) {
      console.error('Search failed', err);
      setError('Search for trials failed.');
    }
  };
  const handleSearchExperts = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/experts', { searchTerm: expertSearchTerm });
      setExperts(response.data);
    } catch (err) {
      console.error('Expert search failed', err);
      setError('Search for experts failed.');
    }
  };
  const handleCategoryClick = async (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedPost(null);
    setReplies([]);
    try {
      const response = await api.get(`/forums/posts/${categoryId}`);
      setPosts(response.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };
  const handlePostClick = async (postId) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
      setReplies([]);
    } else {
      setSelectedPost(postId);
      try {
        const response = await api.get(`/forums/replies/${postId}`);
        setReplies(response.data);
      } catch (err) {
        console.error('Failed to fetch replies', err);
      }
    }
  };
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError("Please select a category before posting.");
      return;
    }
    try {
      const response = await api.post('/forums/posts', {
        title: newPostTitle,
        body: newPostBody,
        communityId: selectedCategory,
      });
      setPosts([response.data, ...posts]);
      setNewPostTitle('');
      setNewPostBody('');
    } catch (err) {
      console.error('Failed to create post', err);
      setError('Could not submit your question.');
    }
  };
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 1500);
  };
  const handleFavorite = async (itemId, itemType) => {
    try {
      await api.post('/favorites', { itemId, itemType });
      showToast('Added to favorites!');
    } catch (err) {
      console.error('Failed to add favorite', err);
      if (err.response && err.response.status === 409) {
        showToast('Item is already in your favorites.');
      } else {
        showToast('Could not add to favorites.');
      }
    }
    setMeetingRequest(null);
  };
  const handleMeetingRequest = (expert) => {
    setMeetingRequest(expert);
  };
  const confirmMeetingRequest = async () => {
    if (!meetingRequest) return;
    try {
      await api.post('/meetings/request', { researcherId: meetingRequest.user_id });
      showToast(`Meeting request sent to ${meetingRequest.full_name}!`);
    } catch (err) {
      console.error('Failed to send request', err);
      showToast('Failed to send request.');
    }
    setMeetingRequest(null);
  };

  const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  // --- Styles Object (COMPLETELY REPLACED) ---
  const baseInputStyle = {
    flex: 1,
    padding: '0.7rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    background: 'var(--background-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.3s ease',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

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
    dashboardContainer: {
      padding: '2rem',
      display: 'flex',
      gap: '2rem',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-start',
      width: '100%',
      boxSizing: 'border-box',
    },
    card: {
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      flex: '1 1 45%', // Allows two columns, wraps on smaller screens
      minWidth: '340px',
      maxHeight: 'calc(100vh - 10rem)', // Adjusted height for scrolling content
      overflowY: 'auto',
      color: 'var(--text-primary)',
    },
    title: { fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--accent-primary)', marginTop: 0 },
    sectionTitle: { fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' },
    
    form: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' },
    formGroup: { marginBottom: '1rem' },
    
    input: baseInputStyle,
    
    inputFocus: {
      borderColor: 'var(--accent-primary)',
      boxShadow: '0 0 8px 0 var(--accent-primary-faded)',
    },
    
    textarea: {
      ...baseInputStyle,
      resize: 'none',
      height: '80px',
    },
    
    select: {
      ...baseInputStyle,
      width: 'auto', 
      padding: '0.65rem 1rem',
      appearance: 'none',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="rgb(148, 163, 184)" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 1rem center',
    },

    btn: {
      background: 'var(--accent-primary)',
      color: 'var(--background-primary)',
      border: 'none',
      padding: '0.7rem 1rem',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: 600,
      whiteSpace: 'nowrap', // Prevent text wrap on buttons
    },
    btnSecondary: {
      background: 'rgba(148, 163, 184, 0.2)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-glass)',
      padding: '0.6rem 1rem',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: 600,
      textDecoration: 'none',
      display: 'inline-block',
      whiteSpace: 'nowrap',
    },
    btnHover: {
      background: 'var(--accent-primary-dark)',
      transform: 'translateY(-1px)',
    },
    resultItem: {
      background: 'var(--background-primary)',
      border: '1px solid var(--border-glass)',
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1rem',
      transition: 'all 0.3s ease',
      color: 'var(--text-secondary)',
    },
    toastBackdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '1rem',
      zIndex: 999,
    },
    toastBox: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--border-glass)',
      padding: '0.75rem 1.25rem', 
      borderRadius: '8px', 
      color: 'var(--text-primary)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    }
  };

  // Dynamic Style Definitions
  const pubInputStyle = { ...styles.input, ...(pubSearchFocused ? styles.inputFocus : {}) };
  const trialInputStyle = { ...styles.input, ...(trialSearchFocused ? styles.inputFocus : {}) };
  const expertInputStyle = { ...styles.input, ...(expertSearchFocused ? styles.inputFocus : {}) };
  const postTitleInputStyle = { ...styles.input, ...(postTitleFocused ? styles.inputFocus : {}) };
  const postBodyInputStyle = { ...styles.textarea, ...(postBodyFocused ? styles.inputFocus : {}) };
  const statusSelectStyle = { ...styles.select, ...(statusFocused ? styles.inputFocus : {}) };
  
  const postSubmitStyle = { ...styles.btn, width: '100%', marginTop: '0.5rem', ...(postSubmitHover ? styles.btnHover : {}) };

  const getButtonStyle = (isPrimary = true, isHovered = false) => {
    let base = isPrimary ? styles.btn : styles.btnSecondary;
    return isHovered ? { ...base, ...styles.btnHover } : base;
  };
  
  if (loading || !profile) {
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
      
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            style={styles.toastBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              style={styles.toastBox}
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
            >
              {toastMessage}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {meetingRequest && (
        <ContactModal
          title="Request Meeting"
          message={`Are you sure you want to request a meeting with ${meetingRequest.full_name}?`}
          onConfirm={confirmMeetingRequest}
          onCancel={() => setMeetingRequest(null)}
        />
      )}

      <motion.div 
        style={styles.dashboardContainer} 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        {/* Left Column */}
        <motion.div 
          style={styles.card} 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible"
        >
          <h2 style={styles.title}>👋 Welcome, {profile.full_name}!</h2>
          <p style={{color: 'var(--text-secondary)'}}>Your registered conditions: <strong>{profile.conditions?.join(', ')}</strong></p>

          {/* --- NOTIFICATIONS --- */}
          <div style={{...styles.resultItem, background: 'var(--background-secondary)'}}>
            <h3 style={{...styles.sectionTitle, border: 'none', margin: '0 0 0.5rem 0'}}>🔔 Notifications ({meetingUpdates.length})</h3>
            <div style={{maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem'}}>
              {meetingUpdates.length === 0 ? (
                <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0}}>No new updates.</p>
              ) : (
                meetingUpdates.map(update => (
                  <motion.div key={update.id} style={{...styles.resultItem, background: 'var(--background-primary)'}} whileHover={{ scale: 1.02 }}>
                    <p style={{margin: 0, fontSize: '0.9rem'}}>
                      Your meeting with <strong>{update.researcher_name}</strong> was accepted!
                    </p>
                    <a 
                      href={`mailto:${update.researcher_email}`} 
                      style={{...styles.btn, background: '#10b981', padding: '0.4rem 0.8rem', textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block'}}
                    >
                      Contact: {update.researcher_email}
                    </a>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          {/* --- END NOTIFICATIONS --- */}

          <h3 style={styles.sectionTitle}>Search Publications</h3>
          <form onSubmit={handleSearchPublications} style={styles.form}>
            <input 
              type="text" 
              style={pubInputStyle} 
              value={pubSearchTerm} 
              placeholder="e.g., Glioma treatment" 
              onChange={(e) => setPubSearchTerm(e.target.value)}
              onFocus={() => setPubSearchFocused(true)}
              onBlur={() => setPubSearchFocused(false)}
            />
            <button 
              type="submit" 
              style={getButtonStyle(true, pubSearchHover)}
              onMouseEnter={() => setPubSearchHover(true)}
              onMouseLeave={() => setPubSearchHover(false)}
            >
              Search
            </button>
          </form>

          <h3 style={styles.sectionTitle}>Search Clinical Trials</h3>
          <form onSubmit={handleSearchTrials} style={{...styles.form, flexWrap: 'wrap'}}>
            <input 
              type="text" 
              style={{...trialInputStyle, minWidth: '150px'}} 
              value={trialSearchTerm} 
              placeholder="e.g., Glioblastoma" 
              onChange={(e) => setTrialSearchTerm(e.target.value)} 
              onFocus={() => setTrialSearchFocused(true)}
              onBlur={() => setTrialSearchFocused(false)}
            />
            <select 
              value={trialStatusFilter} 
              onChange={(e) => setTrialStatusFilter(e.target.value)}
              style={{...statusSelectStyle, flex: '1 1 120px'}}
              onFocus={() => setStatusFocused(true)}
              onBlur={() => setStatusFocused(false)}
            >
              <option value="ALL">All Statuses</option>
              <option value="RECRUITING">Recruiting</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <button 
              type="submit" 
              style={getButtonStyle(true, trialSearchHover)}
              onMouseEnter={() => setTrialSearchHover(true)}
              onMouseLeave={() => setTrialSearchHover(false)}
            >
              Search
            </button>
          </form>

          <h3 style={styles.sectionTitle}>Search Health Experts</h3>
          <form onSubmit={handleSearchExperts} style={{...styles.form, marginBottom: 0}}>
            <input 
              type="text" 
              style={expertInputStyle} 
              value={expertSearchTerm} 
              placeholder="e.g., Oncology" 
              onChange={(e) => setExpertSearchTerm(e.target.value)} 
              onFocus={() => setExpertSearchFocused(true)}
              onBlur={() => setExpertSearchFocused(false)}
            />
            <button 
              type="submit" 
              style={getButtonStyle(true, expertSearchHover)}
              onMouseEnter={() => setExpertSearchHover(true)}
              onMouseLeave={() => setExpertSearchHover(false)}
            >
              Search
            </button>
          </form>
          {error && <p style={{color: '#f87171', marginTop: '1rem'}}>{error}</p>}
        </motion.div>

        {/* Right Column */}
        <motion.div 
          style={styles.card} 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible"
        >
          <h3 style={styles.title}>Community Forums</h3>
          <div style={{ marginBottom: '1rem' }}>
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  ...styles.btnSecondary,
                  background: selectedCategory === cat.id ? 'var(--accent-primary)' : 'rgba(148, 163, 184, 0.2)',
                  color: selectedCategory === cat.id ? 'var(--background-primary)' : 'var(--text-primary)',
                  marginRight: '0.5rem', marginBottom: '0.5rem',
                  border: selectedCategory === cat.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                }}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: 'rgba(255,255,255,0.2)' }} />

          <form onSubmit={handlePostSubmit}>
            <h4>Ask a Question</h4>
            <div style={styles.formGroup}>
              <input
                type="text"
                placeholder="Your question title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                style={postTitleInputStyle}
                onFocus={() => setPostTitleFocused(true)}
                onBlur={() => setPostTitleFocused(false)}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <textarea
                rows="3"
                placeholder="Type your question here..."
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                style={postBodyInputStyle}
                onFocus={() => setPostBodyFocused(true)}
                onBlur={() => setPostBodyFocused(false)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={!selectedCategory} 
              style={{...postSubmitStyle, opacity: !selectedCategory ? 0.5 : 1}}
              onMouseEnter={() => setPostSubmitHover(true)}
              onMouseLeave={() => setPostSubmitHover(false)}
            >
              Post to {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '...'}
            </button>
            {!selectedCategory && <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Please select a category first.
            </small>}
          </form>

          <hr style={{ margin: '1.5rem 0', borderColor: 'rgba(255,255,255,0.2)' }} />

          <h3 style={styles.sectionTitle}>Results</h3>
          <div style={{maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem'}}>
            {publications.map((pub) => (
              <motion.div key={pub.id} style={styles.resultItem} whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary)' }}>
                <h4 style={{color: 'var(--text-primary)', margin: 0}}>{pub.title}</h4>
                <p><strong>AI Summary:</strong> {pub.ai_summary}</p>
                <a href={pub.publication_url} target="_blank" rel="noopener noreferrer" style={{...styles.btnSecondary, marginRight: '0.75rem'}}>Read More</a>
                <button onClick={() => handleFavorite(pub.id, 'PUBLICATION')} style={styles.btnSecondary}>+ Favorite</button>
              </motion.div>
            ))}
            
            {trials.map((trial) => (
              <motion.div key={trial.id} style={styles.resultItem} whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary)' }}>
                <h4 style={{color: 'var(--text-primary)', margin: 0}}>{trial.title}</h4>
                <p><strong>Status:</strong> {trial.status}</p>
                <p><strong>AI Summary:</strong> {trial.ai_summary}</p>
                {trial.contact_email && trial.contact_email !== 'N/A' && (
                  <a href={`mailto:${trial.contact_email}?subject=Question about trial ${trial.id}`} style={{...styles.btnSecondary, marginRight: '0.75rem'}}>Contact Trial</a>
                )}
                <a href={trial.trial_url} target="_blank" rel="noopener noreferrer" style={{...styles.btnSecondary, marginRight: '0.75rem'}}>View Trial</a>
                <button onClick={() => handleFavorite(trial.id, 'TRIAL')} style={styles.btnSecondary}>+ Favorite</button>
              </motion.div>
            ))}
            
            {experts.map((expert) => (
              <motion.div key={expert.user_id} style={styles.resultItem} whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary)' }}>
                <h4 style={{color: 'var(--text-primary)', margin: 0}}>{expert.full_name}</h4>
                <p><strong>Specialties:</strong> {expert.specialties?.join(', ')}</p>
                <p><strong>Interests:</strong> {expert.research_interests?.join(', ')}</p>
                <button onClick={() => handleFavorite(expert.user_id, 'EXPERT')} style={{...styles.btnSecondary, marginRight: '0.5rem'}}>+ Favorite</button>
                <button 
                  onClick={() => handleMeetingRequest(expert)}
                  style={{...styles.btn, background: '#10b981', marginLeft: '0.5rem'}}
                >
                  Request Meeting
                </button>
              </motion.div>
            ))}
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: 'rgba(255,255,255,0.2)' }} />

          <h3 style={styles.sectionTitle}>Forum Posts ({posts.length})</h3>
          <div style={{maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem'}}>
            {posts.map((post) => (
              <motion.div key={post.id} style={{...styles.resultItem, background: 'var(--background-secondary)'}}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h4 style={{color: 'var(--text-primary)', margin: 0}}>{post.title}</h4>
                <p>{post.body}</p>
                <small style={{display: 'block', color: 'var(--accent-primary)'}}>- {post.full_name}</small>
                <button
                  onClick={() => handlePostClick(post.id)}
                  style={{ ...styles.btnSecondary, fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}
                >
                  {selectedPost === post.id ? 'Hide Replies' : 'Show Replies'}
                </button>

                {selectedPost === post.id && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                    {replies.length > 0 ? (
                      replies.map(reply => (
                        <div key={reply.id} style={{ padding: '1rem', background: 'var(--background-primary)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <p style={{ margin: 0 }}>{reply.body}</p>
                          <small style={{color: 'var(--accent-primary)'}}>- {reply.full_name}</small>
                        </div>
                      ))
                    ) : (
                      <p style={{color: 'var(--text-secondary)'}}>No answers yet.</p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

        </motion.div>
      </motion.div>
    </>
  );
}

export default PatientDashboard;