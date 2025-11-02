// src/pages/ManageTrialsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import '../App.css'; // Use the same CSS

function ManageTrialsPage() {
  const [myTrials, setMyTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('RECRUITING');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchMyTrials();
  }, []);

  const fetchMyTrials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trials');
      setMyTrials(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch trials', err);
      setError('Could not load your trials.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/trials', {
        id, title, description, status, location
      });
      // Add new trial to the top of the list
      setMyTrials([response.data, ...myTrials]);
      // Clear the form
      setId('');
      setTitle('');
      setDescription('');
      setLocation('');
    } catch (err) {
      console.error('Failed to create trial', err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create trial.');
      }
    }
  };

  return (
    <div className="dashboard">
      {/* --- COLUMN 1: ADD NEW TRIAL --- */}
      <div className="search-column">
        <h2>Manage Your Clinical Trials</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Trial ID (e.g., NCT123456):</label>
            <input type="text" value={id} onChange={(e) => setId(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Title:</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Description / Summary:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="5" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
              <option value="RECRUITING">Recruiting</option>
              <option value="COMPLETED">Completed</option>
              <option value="NOT_YET_RECRUITING">Not Yet Recruiting</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Location (e.g., New York, USA):</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit">Add This Trial</button>
        </form>
      </div>

      {/* --- COLUMN 2: MY ADDED TRIALS --- */}
      <div className="results-column">
        <h3>My Added Trials</h3>
        {loading && <p>Loading...</p>}
        {myTrials.length === 0 && !loading && (
          <p>You have not added any trials yet.</p>
        )}
        {myTrials.map((trial) => (
          <div key={trial.id} className="result-item">
            <h4>{trial.title}</h4>
            <p><strong>ID:</strong> {trial.id} | <strong>Status:</strong> {trial.status}</p>
            <p>{trial.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageTrialsPage;