import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Use the main App.css file
// --- NEW: Import professional icons ---
import { FaStethoscope, FaDna, FaHeartbeat } from 'react-icons/fa';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-box">
        
        {/* --- UPDATED: Animation with Icons --- */}
        <div className="landing-animation">
          <div className="anim-line"></div>
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

