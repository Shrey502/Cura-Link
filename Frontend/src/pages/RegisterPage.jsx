// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus } from 'react-icons/fa'; // Import an icon
import DigitalClock from '../components/DigitalClock'; // Import the clock

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('PATIENT'); 
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(''); 

    // Basic validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const response = await axios.post('${API_URL}/api/register', {
        email,
        password,
        role,
        fullName,
      });

      console.log('Registration successful:', response.data);
      navigate('/login');

    } catch (err) {
      console.error('Registration failed:', err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    // Add the animation class here
    <div className="form-container form-container-animate">
      
      {/* --- NEW: Animated Header --- */}
      <div className="form-header">
        <div className="form-header-icon">
          <FaUserPlus />
        </div>
        <DigitalClock />
      </div>

      <h1>Create Account</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name:</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>I am a:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="PATIENT">Patient or Caregiver</option>
            <option value="RESEARCHER">Researcher</option>
          </select>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Register
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
