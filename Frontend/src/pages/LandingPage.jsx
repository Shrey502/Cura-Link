// src/pages/LandingPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Keep this for the global CSS variables!
import { useTheme } from '../context/ThemeContext';
import { FaStethoscope, FaDna, FaHeartbeat } from 'react-icons/fa';

function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  // --- State for button hover effects ---
  const [isPatientHover, setIsPatientHover] = useState(false);
  const [isResearcherHover, setIsResearcherHover] = useState(false);

  // --- Canvas Animation Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const particleCount = 150;
    const mouse = {
      x: null,
      y: null,
      radius: 200
    };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };
    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    const getThemeColor = (variable) => {
      const colorString = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
      return colorString || '#0ea5e9';
    };
    
    function Particle(x, y, radius, color, speed) {
      this.x = x;
      this.y = y;
      this.baseX = x;
      this.baseY = y;
      this.radius = radius;
      this.color = color;
      this.speed = speed;
      this.draw = () => {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      };
      this.update = () => {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius + this.radius) {
          this.x -= dx / (distance / 5);
          this.y -= dy / (distance / 5);
        } else {
          if (this.x !== this.baseX) {
            let dx_base = this.x - this.baseX;
            this.x -= dx_base / 20;
          }
          if (this.y !== this.baseY) {
            let dy_base = this.y - this.baseY;
            this.y -= dy_base / 20;
          }
        }
        this.x += this.speed;
        if (this.x > canvas.width + this.radius) {
          this.x = -this.radius;
          this.baseX = -this.radius;
          this.y = Math.random() * canvas.height;
          this.baseY = this.y;
        }
        this.draw();
      };
    }

    function connect() {
      let opacityValue = 1;
      const lineColor = getThemeColor('--accent-primary-faded');
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 140) {
            opacityValue = 1 - (distance / 140);
            let color = lineColor.startsWith('rgba')
              ? lineColor.replace(/[\d\.]+\)$/g, `${opacityValue})`)
              : lineColor;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function init() {
      particles = [];
      const particleColor = getThemeColor('--accent-primary');
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 2 + 1;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speed = Math.random() * 0.5 + 0.1;
        particles.push(new Particle(x, y, radius, particleColor, speed));
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    }

    resizeCanvas();
    init();
    animate();

    const handleResize = () => {
      resizeCanvas();
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, [theme]);


  // --- Inline Style Objects ---
  const styles = {
    landingContainer: {
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      overflow: 'hidden',
      position: 'absolute', // 💡 FIX: Changed from 'relative'
      top: 0,             // 💡 FIX: Added
      left: 0,            // 💡 FIX: Added
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
    landingBox: {
      position: 'relative',
      zIndex: 2,
      background: 'var(--background-glass)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)', // For Safari
      border: '1px solid var(--border-glass)',
      borderRadius: '16px',
      padding: '2.5rem 3rem',
      maxWidth: '700px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    },
    landingAnimation: {
      display: 'flex',
      justifyContent: 'center',
      gap: '2.5rem',
      marginBottom: '2rem',
    },
    animIcon: {
      fontSize: '2.5rem',
      color: 'var(--accent-primary)',
      opacity: 0.8,
    },
    h1: {
      fontSize: '2.75rem',
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: '1rem',
      textShadow: '0 0 10px rgba(14, 165, 233, 0.3)',
    },
    p: {
      fontSize: '1.1rem',
      color: 'var(--text-secondary)',
      lineHeight: 1.6,
      maxWidth: '500px',
      margin: '0 auto 2.5rem auto',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    ctaButton: { // Base style for all buttons
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      fontWeight: 600,
      border: '2px solid transparent',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textDecoration: 'none',
      display: 'inline-block',
    },
    
    // --- Styles for Patient Button (Base + Hover) ---
    patientButton: {
      backgroundColor: 'var(--accent-primary)',
      color: 'var(--background-primary)',
      borderColor: 'var(--accent-primary)',
    },
    patientButtonHover: {
      backgroundColor: 'var(--accent-primary-dark)',
      borderColor: 'var(--accent-primary-dark)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 20px rgba(14, 165, 233, 0.25)',
    },
    
    // --- Styles for Researcher Button (Base + Hover) ---
    researcherButton: {
      backgroundColor: 'transparent',
      color: 'var(--accent-primary)',
      borderColor: 'var(--accent-primary)',
    },
    researcherButtonHover: {
      backgroundColor: 'var(--accent-primary-faded)',
      color: 'var(--text-primary)',
      transform: 'translateY(-2px)',
    },
  };

  // --- Combine base and hover styles dynamically ---
  const patientButtonStyle = {
    ...styles.ctaButton,
    ...styles.patientButton,
    ...(isPatientHover ? styles.patientButtonHover : {}),
  };

  const researcherButtonStyle = {
    ...styles.ctaButton,
    ...styles.researcherButton,
    ...(isResearcherHover ? styles.researcherButtonHover : {}),
  };


  return (
    // Apply styles using the `style` prop
    <div style={styles.landingContainer}>
      <canvas id="landing-canvas" ref={canvasRef} style={styles.landingCanvas}></canvas>
      
      <div style={styles.landingBox}>
        <div style={styles.landingAnimation}>
          <div style={styles.animIcon}>
            <FaStethoscope />
          </div>
          <div style={styles.animIcon}>
            <FaDna />
          </div>
          <div style={styles.animIcon}>
            <FaHeartbeat />
          </div>
        </div>
        
        <h1 style={styles.h1}>Welcome to CuraLink.</h1>
        <p style={styles.p}>Connecting patients, caregivers, and researchers to the latest in medical science. Effortlessly.</p>
        
        <div style={styles.buttonGroup}>
          <button 
            style={patientButtonStyle} // Apply dynamic style
            onClick={() => navigate('/register')}
            onMouseEnter={() => setIsPatientHover(true)} // Set hover state
            onMouseLeave={() => setIsPatientHover(false)} // Unset hover state
          >
            I am a Patient or Caregiver
          </button>
          
          <button 
            style={researcherButtonStyle} // Apply dynamic style
            onClick={() => navigate('/register')}
            onMouseEnter={() => setIsResearcherHover(true)} // Set hover state
            onMouseLeave={() => setIsResearcherHover(false)} // Unset hover state
          >
            I am a Researcher
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;