// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Import the api helper

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Send login request
      const response = await axios.post('http://localhost:3001/api/login', {
        email,
        password,
      });

      const { token, user } = response.data;

      // 2. Save token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Store user info

      console.log('Login successful:', user);

      // 3. --- THIS IS THE UPDATED ONBOARDING LOGIC ---
      if (user.role === 'PATIENT') {
        // We're logged in, so we can use our 'api' helper
        try {
          // Check the profile to see if it's complete
          const profileResponse = await api.get('/profile/patient');
          const profile = profileResponse.data.profile;

          // Check if conditions are missing. 'conditions' is a JSONB array.
          if (profile.conditions === null || profile.conditions === '[]' || (Array.isArray(profile.conditions) && profile.conditions.length === 0)) {
            // Profile is incomplete! Send to patient onboarding.
            navigate('/onboarding/patient');
          } else {
            // Profile is complete. Send to dashboard.
            navigate('/dashboard/patient');
          }
        } catch (profileError) {
          // If profile doesn't exist (404), it's incomplete.
          navigate('/onboarding/patient');
        }
      
      } else if (user.role === 'RESEARCHER') {
        try {
          const profileResponse = await api.get('/profile/researcher');
          const profile = profileResponse.data.profile;

          // Check if specialties are missing
          if (profile.specialties === null || profile.specialties === '[]' || (Array.isArray(profile.specialties) && profile.specialties.length === 0)) {
            navigate('/onboarding/researcher');
          } else {
            navigate('/dashboard/researcher');
          }
        } catch (profileError) {
          // If profile doesn't exist (404), it's incomplete.
          navigate('/onboarding/researcher');
        }
      }
    } catch (err) {
      console.error('Login failed:', err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error); // "Invalid credentials"
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Show error message if it exists */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;

