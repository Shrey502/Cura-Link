// src/pages/FavoritesPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import api from '../api';
import '../App.css';
import { useTheme } from '../context/ThemeContext';

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canvasRef = useRef(null);
  const { theme } = useTheme();

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


  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/favorites');
      setFavorites(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
      setError('Could not load your favorites.');
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (itemId, itemType) => {
    try {
      await api.delete('/favorites', {
        data: { itemId, itemType }
      });
      setFavorites(prevFavorites => 
        prevFavorites.filter(fav => 
          !(fav.favorited_item_id === itemId && fav.item_type === itemType)
        )
      );
    } catch (err) {
      console.error('Failed to remove favorite', err);
      alert('Could not remove favorite.');
    }
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
    pageContainer: {
      width: '100%',
      padding: '2rem',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    mainCard: {
      width: '100%',
      maxWidth: '900px',
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.05)', 
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      maxHeight: 'calc(100vh - 10rem)',
      overflowY: 'auto',
    },
    resultItem: {
      background: 'var(--background-primary)',
      borderRadius: '8px',
      padding: '1.25rem',
      marginBottom: '1rem',
      border: '1px solid var(--border-glass)',
      transition: 'border-color 0.3s ease',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    resultActions: {
      flexShrink: 0,
      marginRight: '1.5rem',
    },
    resultInfo: {
      flex: 1, // Takes up remaining space
      // Removed textAlign: 'right'
    },
    tag: {
      background: 'var(--accent-primary-faded)',
      color: 'var(--accent-primary)',
      padding: '0.25rem 0.6rem',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    removeButton: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '0.4rem 0.8rem',
      fontSize: '0.8rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
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
    infoText: {
      color: 'var(--text-secondary)', 
      fontSize: '0.9rem', 
      margin: '0', // Reset margin
      paddingTop: '0.25rem', // Add a little space from the top
    },
  };

  if (loading) {
    return (
      <div style={styles.spinnerContainer}>
        <canvas ref={canvasRef} style={styles.landingCanvas} /> 
        <div className="spinner" />
      </div>
    );
  }
  
  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#f87171' }}>{error}</p>
    </div>
  );

  return (
    <>
      <canvas ref={canvasRef} style={styles.landingCanvas} />
      
      <motion.div 
        style={styles.pageContainer}
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        <motion.div 
          style={styles.mainCard}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
        >
          <h1 style={{ color: 'var(--text-primary)', marginTop: 0, textAlign: 'center' }}>
            My Favorites
          </h1>
        
          {favorites.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              You haven't added any favorites yet.
            </p>
          ) : (
            favorites.map((fav) => (
              <motion.div 
                key={`${fav.item_type}-${fav.favorited_item_id}`} 
                style={styles.resultItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary)' }}
              >
                {/* --- LEFT COLUMN --- */}
                <div style={styles.resultActions}>
                  <span style={styles.tag}>
                    {fav.item_type}
                  </span>
                  
                  <h4 style={{ marginTop: '0.75rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    {fav.title}
                  </h4>
                  
                  <motion.button 
                    onClick={() => handleRemoveFavorite(fav.favorited_item_id, fav.item_type)}
                    style={styles.removeButton}
                    whileHover={{ backgroundColor: '#dc2626' }}
                  >
                    Remove
                  </motion.button>
                </div>

                {/* --- 💡 FIXED: RIGHT COLUMN --- */}
                {/* This will now render the summary if it exists, for any item type */}
                <div style={styles.resultInfo}>
                  {fav.summary && (
                    <p style={styles.infoText}>
                      {fav.summary}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

export default FavoritesPage;