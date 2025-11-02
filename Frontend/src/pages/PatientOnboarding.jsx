import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function PatientOnboarding() {
  const [conditionInput, setConditionInput] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // NOTE: This is where AI would normally process the NL input. 
  // For the MVP, we simulate the NLP process by simply splitting the comma-separated input.
  const processConditions = (input) => {
    return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!conditionInput) {
        setError('Please describe your condition or symptoms.');
        return;
    }
    
    // Use the full name we stored during registration
    const fullName = user.full_name || 'Patient User'; 
    const processedConditions = processConditions(conditionInput);

    try {
      await api.put('/profile/patient', {
        fullName: fullName,
        conditions: processedConditions,
        location: location,
      });

      // After successful update, send to the real dashboard
      navigate('/dashboard/patient');

    } catch (err) {
      console.error('Profile update failed', err);
      setError('Could not update your profile. Please try again.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>Welcome, {user.full_name}</h1>
      <p>Please tell us about your health interests to personalize your experience. (Example: "I have Brain Cancer.")</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Your Condition/Symptoms:</label>
          <input
            type="text"
            value={conditionInput}
            onChange={(e) => setConditionInput(e.target.value)}
            placeholder="e.g., Brain Cancer, recurring fatigue"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Your Location (City, Country):</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., London, UK"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Save and Start Exploring
        </button>
      </form>
    </div>
  );
}

export default PatientOnboarding;
