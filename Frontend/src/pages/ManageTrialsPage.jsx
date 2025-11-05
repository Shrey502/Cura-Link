// src/pages/ManageTrialsPage.jsx
import React, { useState, useEffect, useRef } from 'react'; // 💡 Added useRef
import { useNavigate } from 'react-router-dom'; // 💡 Added useNavigate
import { motion, AnimatePresence } from "framer-motion"; // 💡 Added motion
import api from '../api';
import '../App.css';
import { useTheme } from '../context/ThemeContext'; // 💡 Added useTheme

function ManageTrialsPage() {
  const [myTrials, setMyTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    status: 'RECRUITING',
    location: '',
    contact_email: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trialToDelete, setTrialToDelete] = useState(null);

  // --- 💡 NEW: Canvas, Theme, and Focus States ---
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const [idFocused, setIdFocused] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [contactEmailFocused, setContactEmailFocused] = useState(false);
  const [statusFocused, setStatusFocused] = useState(false);

  // --- 💡 NEW: Button Hover States ---
  const [submitHover, setSubmitHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const [deleteYesHover, setDeleteYesHover] = useState(false);
  const [deleteNoHover, setDeleteNoHover] = useState(false);


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
  }, [theme]); // Re-run if theme changes


  // --- Data Fetching (Unchanged) ---
  useEffect(() => {
    fetchMyTrials();
  }, []);

  const fetchMyTrials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trials');
      setMyTrials(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch trials', err);
      setError('Could not load your trials.');
      setLoading(false);
    }
  };
  
  // --- Form Handlers (Unchanged) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearForm = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      status: 'RECRUITING',
      location: '',
      contact_email: ''
    });
    setIsEditing(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isEditing) {
        const response = await api.put(`/trials/${formData.id}`, formData);
        setMyTrials(myTrials.map(t => (t.id === formData.id ? response.data : t)));
      } else {
        const response = await api.post('/trials', formData);
        setMyTrials([response.data, ...myTrials]);
      }
      clearForm();
      
    } catch (err) {
      console.error('Failed to submit trial', err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(`Failed to ${isEditing ? 'update' : 'create'} trial.`);
      }
    }
  };

  const handleEdit = (trial) => {
    setIsEditing(true);
    setFormData({
      id: trial.id,
      title: trial.title,
      description: trial.description,
      status: trial.status,
      location: trial.location || '',
      contact_email: trial.contact_email || ''
    });
    window.scrollTo(0, 0); 
  };

  const handleDelete = (trialId) => {
    setTrialToDelete(trialId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!trialToDelete) return;
    try {
      await api.delete(`/trials/${trialToDelete}`);
      setMyTrials(myTrials.filter(t => t.id !== trialToDelete));
    } catch (err) {
      console.error('Failed to delete trial', err);
      setError('Failed to delete trial.');
    } finally {
      setIsModalOpen(false);
      setTrialToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setTrialToDelete(null);
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
    column: {
      flex: 1,
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.05)', 
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      maxHeight: 'calc(100vh - 13rem)', 
      overflowY: 'auto',
    },
    formGroup: {
      marginBottom: '1rem', // A bit tighter for this form
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
    // Style for <select> to match <input>
    select: {
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: 'var(--background-primary)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      borderRadius: '8px',
      color: 'var(--text-primary)',
      fontSize: '1rem',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      appearance: 'none', // Remove default OS dropdown arrow
      backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="rgb(148, 163, 184)" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 1rem center',
    },
    selectFocus: {
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
    },
    // --- 💡 NEW: Modal Styles ---
    modalBackdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBox: {
      background: 'var(--background-primary)', // Use a solid background
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      padding: '2rem',
      maxWidth: '450px',
      width: '100%',
      textAlign: 'center',
    },
    modalButtons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    // --- 💡 NEW: Button Styles ---
    ctaButton: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      fontWeight: 600,
      border: '2px solid transparent',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textDecoration: 'none',
      display: 'inline-block',
      width: '100%',
    },
    submitButtonBase: {
      backgroundColor: 'var(--accent-primary)',
      color: 'var(--background-primary)',
      borderColor: 'var(--accent-primary)',
    },
    submitButtonHover: {
      backgroundColor: 'var(--accent-primary-dark)',
      borderColor: 'var(--accent-primary-dark)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 20px rgba(14, 165, 233, 0.25)',
    },
    cancelButtonBase: {
      backgroundColor: 'var(--text-secondary)',
      color: 'var(--background-primary)',
      borderColor: 'var(--text-secondary)',
    },
    cancelButtonHover: {
      backgroundColor: 'var(--border-glass)', // A bit darker gray
      color: 'var(--text-primary)',
      transform: 'translateY(-2px)',
    },
    deleteButtonBase: { // For "Yes, Delete"
      backgroundColor: '#ef4444', // Red
      color: 'white',
      borderColor: '#ef4444',
    },
    deleteButtonHover: {
      backgroundColor: '#dc2626', // Darker Red
      borderColor: '#dc2626',
      transform: 'translateY(-2px)',
    },
  };
  
  // --- 💡 NEW: Dynamic Style Definitions ---
  const idInputStyle = { ...styles.input, ...(idFocused ? styles.inputFocus : {}), ...(isEditing ? { background: 'var(--border-glass)', color: 'var(--text-secondary)'} : {}) };
  const titleInputStyle = { ...styles.input, ...(titleFocused ? styles.inputFocus : {}) };
  const descriptionInputStyle = { ...styles.textarea, ...(descriptionFocused ? styles.textareaFocus : {}) };
  const statusSelectStyle = { ...styles.select, ...(statusFocused ? styles.selectFocus : {}) };
  const locationInputStyle = { ...styles.input, ...(locationFocused ? styles.inputFocus : {}) };
  const contactEmailInputStyle = { ...styles.input, ...(contactEmailFocused ? styles.inputFocus : {}) };

  const submitButtonStyle = { ...styles.ctaButton, ...styles.submitButtonBase, ...(submitHover ? styles.submitButtonHover : {}) };
  const cancelButtonStyle = { ...styles.ctaButton, ...styles.cancelButtonBase, ...(cancelHover ? styles.cancelButtonHover : {}), width: 'auto', marginLeft: '1rem' };
  
  const deleteYesStyle = { ...styles.ctaButton, ...styles.deleteButtonBase, ...(deleteYesHover ? styles.deleteButtonHover : {}), width: 'auto' };
  const deleteNoStyle = { ...styles.ctaButton, ...styles.cancelButtonBase, ...(deleteNoHover ? styles.cancelButtonHover : {}), width: 'auto' };


  if (loading && myTrials.length === 0) { // Only show full-page spinner on initial load
    return (
      <div style={styles.spinnerContainer}>
        <canvas ref={canvasRef} style={styles.landingCanvas} />
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* 💡 1. ADD CANVAS AND MODAL */}
      <canvas ref={canvasRef} style={styles.landingCanvas} />
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            style={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              style={styles.modalBox}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
            >
              <h3 style={{color: 'var(--text-primary)', marginTop: 0}}>Confirm Deletion</h3>
              <p style={{color: 'var(--text-secondary)'}}>Are you sure you want to delete this trial?</p>
              <div style={styles.modalButtons}>
                <button 
                  onClick={cancelDelete} 
                  style={deleteNoStyle}
                  onMouseEnter={() => setDeleteNoHover(true)}
                  onMouseLeave={() => setDeleteNoHover(false)}
                >
                  No, Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  style={deleteYesStyle}
                  onMouseEnter={() => setDeleteYesHover(true)}
                  onMouseLeave={() => setDeleteYesHover(false)}
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* --- COLUMN 1: ADD/EDIT TRIAL --- */}
        <motion.div 
          style={styles.column}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
        >
          <h2 style={{color: 'var(--text-primary)', marginTop: 0}}>{isEditing ? 'Update Your Trial' : 'Add a New Trial'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Trial ID (e.g., NCT123456):</label>
              <input type="text" name="id" value={formData.id} onChange={handleChange} required disabled={isEditing} 
                style={idInputStyle}
                onFocus={() => setIdFocused(true)}
                onBlur={() => setIdFocused(false)}
              />
              {isEditing && <small style={{color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block'}}>Trial ID cannot be changed.</small>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Title:</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required 
                style={titleInputStyle}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Description / Summary:</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows="5" 
                style={descriptionInputStyle}
                onFocus={() => setDescriptionFocused(true)}
                onBlur={() => setDescriptionFocused(false)}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Status:</label>
              <select name="status" value={formData.status} onChange={handleChange} 
                style={statusSelectStyle}
                onFocus={() => setStatusFocused(true)}
                onBlur={() => setStatusFocused(false)}
              >
                <option value="RECRUITING">Recruiting</option>
                <option value="COMPLETED">Completed</option>
                <option value="NOT_YET_RECRUITING">Not Yet Recruiting</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Location (e.g., New York, USA):</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} 
                style={locationInputStyle}
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setLocationFocused(false)}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Contact Email:</label>
              <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} 
                style={contactEmailInputStyle}
                onFocus={() => setContactEmailFocused(true)}
                onBlur={() => setContactEmailFocused(false)}
              />
            </div>
            
            {error && <p style={{ color: '#f87171', fontSize: '0.9rem' }}>{error}</p>}
            
            <button 
              type="submit" 
              style={submitButtonStyle}
              onMouseEnter={() => setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
            >
              {isEditing ? 'Update Trial' : 'Add This Trial'}
            </button>
            
            {isEditing && (
              <button 
                type="button" 
                onClick={clearForm} 
                style={cancelButtonStyle}
                onMouseEnter={() => setCancelHover(true)}
                onMouseLeave={() => setCancelHover(false)}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </motion.div>

        {/* --- COLUMN 2: MY ADDED TRIALS --- */}
        <motion.div 
          style={styles.column}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
        >
          <h3 style={{color: 'var(--text-primary)', marginTop: 0}}>My Added Trials</h3>
          {loading && myTrials.length > 0 && ( // Show inline spinner only on refresh
            <div style={{display: 'flex', justifyContent: 'center', padding: '1rem'}}>
              <div className="spinner" />
            </div>
          )}
          {myTrials.length === 0 && !loading && (
            <p style={{color: 'var(--text-secondary)'}}>You have not added any trials yet.</p>
          )}
          {myTrials.map((trial) => (
            <div key={trial.id} className="result-item" style={{background: 'var(--background-primary)', borderRadius: '8px', padding: '1.25rem'}}>
              <h4 style={{color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.5rem'}}>{trial.title}</h4>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 0.75rem 0'}}>
                <strong>ID:</strong> {trial.id} | <strong>Status:</strong> {trial.status}
              </p>
              <p style={{color: 'var(--text-secondary)', margin: '0 0 1rem 0', fontSize: '0.95rem'}}>{trial.description}</p>
              <button onClick={() => handleEdit(trial)} className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>
                Edit
              </button>
              <button onClick={() => handleDelete(trial.id)} className="btn btn-danger">
                Delete
              </button>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </>
  );
}

export default ManageTrialsPage;