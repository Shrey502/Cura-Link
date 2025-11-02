// src/pages/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // We'll create this file

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-box">
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