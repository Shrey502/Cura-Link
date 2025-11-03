// src/pages/LandingPage.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Use the main App.css file
import { useTheme } from '../context/ThemeContext'; // Import theme context
import { FaStethoscope, FaDna, FaHeartbeat } from 'react-icons/fa'; // Import icons

function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const { theme } = useTheme(); // Get current theme

  // --- This is the "Plexus" Canvas Animation Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    const particleCount = 150; // Increased particle count

    const mouse = {
      x: null,
      y: null,
      radius: 200 // Increased mouse interaction radius
    };

    // --- Define named functions for event listeners ---
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };
    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    // --- Use named functions ---
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    // Get colors from CSS variables
    const getThemeColor = (variable) => {
      const colorString = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
      return colorString || '#0ea5e9'; // Fallback
    };
    
    // Particle object
    function Particle(x, y, radius, color, speed) {
      this.x = x;
      this.y = y;
      this.baseX = x; // Remember original x
      this.baseY = y; // Remember original y
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
        // --- Mouse Interaction (repel) ---
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius + this.radius) {
          // Repel from mouse
          this.x -= dx / (distance / 5); // Adjust repulsion strength
          this.y -= dy / (distance / 5);
        } else {
          // Return to base position (or move)
          if (this.x !== this.baseX) {
            let dx_base = this.x - this.baseX;
            this.x -= dx_base / 20; // Adjust return speed
          }
          if (this.y !== this.baseY) {
            let dy_base = this.y - this.baseY;
            this.y -= dy_base / 20;
          }
        }
        
        // Original right-ward movement
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

    // --- Connect dots function ---
    function connect() {
      let opacityValue = 1;
      const lineColor = getThemeColor('--accent-primary-faded'); // Get the faded color
      
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) { // Start from a+1 to avoid self-connection
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          // --- Connect particles to each other ---
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

    // Create particles
    function init() {
      particles = [];
      const particleColor = getThemeColor('--accent-primary');
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 2 + 1; // size 1-3px
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speed = Math.random() * 0.5 + 0.1; // speed 0.1-0.6
        particles.push(new Particle(x, y, radius, particleColor, speed));
      }
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect(); // Call connect function
      animationFrameId = requestAnimationFrame(animate);
    }

    // Start
    resizeCanvas();
    init();
    animate();

    // Re-init on window resize
    const handleResize = () => {
      resizeCanvas();
      init();
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup function ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, [theme]); // Re-run if theme changes to update color

  return (
    <div className="landing-container">
      {/* --- NEW: Canvas Element --- */}
      <canvas id="landing-canvas" ref={canvasRef}></canvas>
      
      <div className="landing-box">
        {/* We can keep the icon animation inside the box */}
        <div className="landing-animation">
          <div className="anim-icon icon-1">
            <FaStethoscope />
          </div>
          <div className="anim-icon icon-2">
            <FaDna />
          </div>
          <div className="anim-icon icon-3">
            <FaHeartbeat />
          </div>
        </div>
        
        <h1>Welcome to CuraLink.</h1>
        <p>Connecting patients, caregivers, and researchers to the latest in medical science. Effortlessly.</p>
        
        <div className="button-group">
          <button 
            className="cta-button patient"
            onClick={() => navigate('/register')}
          >
            I am a Patient or Caregiver
          </button>
          
          <button 
            className="cta-button researcher"
            onClick={() => navigate('/register')}
          >
            I am a Researcher
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;

