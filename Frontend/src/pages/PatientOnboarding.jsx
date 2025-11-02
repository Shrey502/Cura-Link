// src/pages/PatientOnboarding.jsx
import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // We need axios for the direct HF call

function PatientOnboarding() {
  const [conditionsText, setConditionsText] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user'));
  const [fullName, setFullName] = useState(user?.full_name || 'Patient');

  const getConditionsFromAI = async (text) => {
    const hfUrl = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
    const candidate_labels = [
      "brain cancer", "lung cancer", "breast cancer", "glioblastoma", "glioma",
      "diabetes", "heart disease", "arthritis", "alzheimer's", "parkinson's", "multiple sclerosis"
    ];

    const HUGGING_FACE_KEY = import.meta.env.VITE_HF_API_KEY;
    if (!HUGGING_FACE_KEY) {
      console.error("Hugging Face API key is missing!");
      setError("AI service is not configured. Please enter conditions manually (comma-separated).");
      return text.split(',').map(s => s.trim());
    }

    try {
      const response = await axios.post(
        hfUrl,
        {
          "inputs": text,
          "parameters": { candidate_labels }
        },
        {
          headers: { 
            'Authorization': `Bearer ${HUGGING_FACE_KEY}` 
          }
        }
      );
      
      // --- THIS IS THE FIX ---
      // The AI is not very confident, so we'll lower the threshold from 0.8 to 0.4
      const threshold = 0.4; 
      // --- END OF FIX ---

      const labels = response.data.labels;
      const scores = response.data.scores;
      const foundConditions = labels.filter((label, index) => scores[index] > threshold);
      
      if (foundConditions.length > 0) {
        return foundConditions;
      } else {
        return text.split(',').map(s => s.trim());
      }

    } catch (aiError) {
      console.error("AI condition extraction failed:", aiError);
      setError("AI analysis failed. Please enter your conditions manually (comma-separated).");
      return text.split(',').map(s => s.trim());
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError('Processing with AI... please wait.');

    const conditionsArray = await getConditionsFromAI(conditionsText);
    
    try {
      await api.put('/profile/patient', {
        fullName: fullName, 
        location: location,
        conditions: conditionsArray,
      });

      setLoading(false);
      navigate('/dashboard/patient');

    } catch (err) {
      setLoading(false);
      console.error('Profile update failed', err);
      setError('Could not update your profile. Please try again.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>Welcome, {user.email}!</h1>
      <p>Please complete your profile to personalize your experience.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Your Full Name:</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Describe your medical conditions (e.g., "I have brain cancer"):</label>
          <textarea
            value={conditionsText}
            onChange={(e) => setConditionsText(e.target.value)}
            placeholder="Our AI will extract the key conditions..."
            required
            rows="3"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Your Location (City, Country):</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., New York, USA"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ padding: '0.5rem 1rem' }} disabled={loading}>
          {loading ? 'Processing...' : 'Save and Start Exploring'}
        </button>
      </form>
    </div>
  );
}

export default PatientOnboarding;

