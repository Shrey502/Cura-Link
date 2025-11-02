// src/pages/ResearcherOnboarding.jsx
import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function ResearcherOnboarding() {
  const [specialties, setSpecialties] = useState('');
  const [researchInterests, setResearchInterests] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // We get the full name from the user object we saved at login
    const fullName = user.full_name || 'Dr. User'; 

    try {
      // Split comma-separated strings into arrays
      const specialtiesArray = specialties.split(',').map(s => s.trim());
      const interestsArray = researchInterests.split(',').map(s => s.trim());

      await api.put('/profile/researcher', {
        fullName: fullName,
        specialties: specialtiesArray,
        researchInterests: interestsArray,
        isAvailableForMeetings: isAvailable,
      });

      // After successful update, send to the real dashboard
      navigate('/dashboard/researcher');

    } catch (err) {
      console.error('Profile update failed', err);
      setError('Could not update your profile. Please try again.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>Welcome, {user.email}</h1>
      <p>Please complete your profile to continue.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Your Specialties (comma-separated):</label>
          <input
            type="text"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            placeholder="e.g., Oncology, Immunotherapy"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Research Interests (comma-separated):</label>
          <input
            type="text"
            value={researchInterests}
            onChange={(e) => setResearchInterests(e.target.value)}
            placeholder="e.g., Clinical AI, Gene Therapy"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Are you available for meetings with patients?
          </label>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Save and Continue
        </button>
      </form>
    </div>
  );
}

export default ResearcherOnboarding;