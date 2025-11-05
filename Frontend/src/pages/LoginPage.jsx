// src/pages/LoginPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import '../App.css'; // Import for global CSS variables
import { useTheme } from '../context/ThemeContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [isSubmitHover, setIsSubmitHover] = useState(false);
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  // --- 💡 NEW: State for input focus animations ---
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('${API_URL}/api/login', {
        email,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Login successful:', user);

      if (user.role === 'PATIENT') {
        try {
          const profileResponse = await api.get('/profile/patient');
          const profile = profileResponse.data.profile;
          if (profile.conditions === null || profile.conditions === '[]' || (Array.isArray(profile.conditions) && profile.conditions.length === 0)) {
            navigate('/onboarding/patient');
          } else {
            navigate('/dashboard/patient');
          }
        } catch (profileError) {
          navigate('/onboarding/patient');
        }
      } else if (user.role === 'RESEARCHER') {
        try {
          const profileResponse = await api.get('/profile/researcher');
          const profile = profileResponse.data.profile;
          if (profile.specialties === null || profile.specialties === '[]' || (Array.isArray(profile.specialties) && profile.specialties.length === 0)) {
            navigate('/onboarding/researcher');
          } else {
            navigate('/dashboard/researcher');
          }
        } catch (profileError) {
          navigate('/onboarding/researcher');
        }
      }
    } catch (err) {
      console.error('Login failed:', err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  // --- "Floating Dust" Animation Logic (Unchanged) ---
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


  // --- 💡 UPDATED: Inline Style Objects ---
  const styles = {
    // Container and Canvas styles (unchanged)
    landingContainer: {
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: 'var(--background-primary)',
    },
    landingCanvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
    },
    loginBox: {
      position: 'relative',
      zIndex: 2,
      background: 'var(--background-glass)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '16px',
      padding: '2.5rem 3rem',
      maxWidth: '450px', 
      width: '100%',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    },
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: '2rem',
      textAlign: 'center',
      textShadow: '0 0 10px rgba(14, 165, 233, 0.3)',
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
    // --- 💡 UPDATED Input Style ---
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      // This opaque background contrasts with the semi-transparent card
      backgroundColor: 'var(--background-primary)', 
      // Made border slightly more visible than --border-glass
      // This assumes --text-secondary is approx rgba(148, 163, 184, 1)
      border: '1px solid rgba(148, 163, 184, 0.3)', 
      borderRadius: '8px',
      color: 'var(--text-primary)',
      fontSize: '1rem',
      boxSizing: 'border-box',
      // Added transition for the animation
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease', 
    },
    // --- 💡 NEW: Style for focused input ---
    inputFocus: {
      borderColor: 'var(--accent-primary)',
      boxShadow: '0 0 10px 0 var(--accent-primary-faded)',
    },
    errorText: {
      color: '#f87171',
      textAlign: 'center',
      marginBottom: '1rem',
      fontSize: '0.9rem',
    },
    // Button styles (unchanged)
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
    registerLink: {
      marginTop: '1.5rem',
      textAlign: 'center',
      fontSize: '0.9rem',
      color: 'var(--text-secondary)',
    },
    link: {
      color: 'var(--accent-primary)',
      textDecoration: 'none',
      fontWeight: '600',
    }
  };

  // --- 💡 NEW: Combine base and focused styles dynamically ---
  const submitButtonStyle = {
    ...styles.ctaButton,
    ...styles.submitButtonBase,
    ...(isSubmitHover ? styles.submitButtonHover : {}),
  };

  const emailInputStyle = {
    ...styles.input,
    ...(isEmailFocused ? styles.inputFocus : {}),
  };

  const passwordInputStyle = {
    ...styles.input,
    ...(isPasswordFocused ? styles.inputFocus : {}),
  };

  return (
    <div style={styles.landingContainer}>
      <canvas id="login-canvas" ref={canvasRef} style={styles.landingCanvas}></canvas>
      
      <div style={styles.loginBox}>
        <h1 style={styles.h1}>Login to CuraLink</h1>
        
        <form onSubmit={handleSubmit}>
          {/* --- 💡 UPDATED Email Input --- */}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={emailInputStyle} // Use dynamic style
              onFocus={() => setIsEmailFocused(true)} // Add focus handler
              onBlur={() => setIsEmailFocused(false)} // Add blur handler
            />
          </div>

          {/* --- 💡 UPDATED Password Input --- */}
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={passwordInputStyle} // Use dynamic style
              onFocus={() => setIsPasswordFocused(true)} // Add focus handler
              onBlur={() => setIsPasswordFocused(false)} // Add blur handler
            />
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          <button 
            type="submit" 
            style={submitButtonStyle}
            onMouseEnter={() => setIsSubmitHover(true)}
            onMouseLeave={() => setIsSubmitHover(false)}
          >
            Login
          </button>
        </form>

        <div style={styles.registerLink}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;