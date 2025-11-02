import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Need this for profile check

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
      localStorage.setItem('user', JSON.stringify(user));

      // 3. --- NEW LOGIC: Check Profile Completion ---
      if (user.role === 'PATIENT') {
        try {
          const profileResponse = await api.get('/profile/patient');
          const profile = profileResponse.data.profile;

          if (!profile.conditions || profile.conditions.length === 0) {
            // Profile is incomplete! Send to patient onboarding.
            navigate('/onboarding/patient');
          } else {
            // Profile is complete. Send to dashboard.
            navigate('/dashboard/patient');
          }
        } catch (profileError) {
          console.error("Could not fetch patient profile after login", profileError);
          navigate('/onboarding/patient'); 
        }
      } else if (user.role === 'RESEARCHER') {
        try {
          const profileResponse = await api.get('/profile/researcher');
          const profile = profileResponse.data.profile;

          if (profile.specialties === null || profile.specialties.length === 0) {
            // Profile is incomplete! Send to researcher onboarding.
            navigate('/onboarding/researcher');
          } else {
            // Profile is complete. Send to dashboard.
            navigate('/dashboard/researcher');
          }
        } catch (profileError) {
          console.error("Could not fetch researcher profile after login", profileError);
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

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        {/* ... (rest of form JSX) ... */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
