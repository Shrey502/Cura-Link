// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('PATIENT'); // Default to PATIENT
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // This function runs when the user submits the form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the page from reloading
    setError(''); // Clear any old errors

    try {
      // Send the data to our backend API
      const response = await axios.post('http://localhost:3001/api/register', {
        email,
        password,
        role,
        fullName,
      });

      // If registration is successful
      console.log('Registration successful:', response.data);
      
      // Send the user to the login page
      navigate('/login');

    } catch (err) {
      // If the backend sends an error
      console.error('Registration failed:', err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error); // e.g., "Email already exists"
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        {/* Full Name Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Full Name:</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        {/* Email Input */}
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

        {/* Password Input */}
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

        {/* Role Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label>I am a:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="PATIENT">Patient or Caregiver</option>
            <option value="RESEARCHER">Researcher</option>
          </select>
        </div>

        {/* Show error message if it exists */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Register
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;