// src/pages/ManageTrialsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import '../App.css'; // Use the same CSS

function ManageTrialsPage() {
  const [myTrials, setMyTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    status: 'RECRUITING',
    location: '',
    contact_email: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trialToDelete, setTrialToDelete] = useState(null);
  // ---

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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearForm = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      status: 'RECRUITING',
      location: '',
      contact_email: ''
    });
    setIsEditing(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isEditing) {
        // --- UPDATE ---
        const response = await api.put(`/trials/${formData.id}`, formData);
        setMyTrials(myTrials.map(t => (t.id === formData.id ? response.data : t)));
      } else {
        // --- CREATE ---
        const response = await api.post('/trials', formData);
        setMyTrials([response.data, ...myTrials]);
      }
      clearForm();
      
    } catch (err) {
      console.error('Failed to submit trial', err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(`Failed to ${isEditing ? 'update' : 'create'} trial.`);
      }
    }
  };

  const handleEdit = (trial) => {
    setIsEditing(true);
    setFormData({
      id: trial.id,
      title: trial.title,
      description: trial.description,
      status: trial.status,
      location: trial.location || '',
      contact_email: trial.contact_email || ''
    });
    window.scrollTo(0, 0); 
  };

  // --- This now *opens* the modal ---
  const handleDelete = (trialId) => {
    setTrialToDelete(trialId); // Remember which trial to delete
    setIsModalOpen(true);    // Open the modal
  };

  // --- This runs when "Yes" is clicked ---
  const confirmDelete = async () => {
    if (!trialToDelete) return;
    
    try {
      await api.delete(`/trials/${trialToDelete}`);
      // Remove from list
      setMyTrials(myTrials.filter(t => t.id !== trialToDelete));
    } catch (err) {
      console.error('Failed to delete trial', err);
      setError('Failed to delete trial.');
    } finally {
      // Close the modal and clear the state
      setIsModalOpen(false);
      setTrialToDelete(null);
    }
  };

  // --- This runs when "No" is clicked ---
  const cancelDelete = () => {
    setIsModalOpen(false);
    setTrialToDelete(null);
  };

  return (
    <>
      {/* --- Confirmation Modal --- */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this trial?</p>
            <div className="modal-buttons">
              <button onClick={cancelDelete} className="btn-no">No, Cancel</button>
              <button onClick={confirmDelete} className="btn-yes">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Your existing dashboard page */}
      <div className="dashboard">
        {/* --- COLUMN 1: ADD/EDIT TRIAL --- */}
        <div className="search-column">
          <h2>{isEditing ? 'Update Your Trial' : 'Add a New Trial'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Trial ID (e.g., NCT123456):</label>
              <input type="text" name="id" value={formData.id} onChange={handleChange} required disabled={isEditing} style={{ width: '100%', boxSizing: 'border-box' }} />
              {isEditing && <small>Trial ID cannot be changed.</small>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Title:</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Description / Summary:</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows="5" style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Status:</label>
              <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%' }}>
                <option value="RECRUITING">Recruiting</option>
                <option value="COMPLETED">Completed</option>
                <option value="NOT_YET_RECRUITING">Not Yet Recruiting</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Location (e.g., New York, USA):</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Contact Email:</label>
              <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">{isEditing ? 'Update Trial' : 'Add This Trial'}</button>
            {isEditing && (
              <button type="button" onClick={clearForm} style={{ background: '#6c757d', marginLeft: '1rem' }}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* --- COLUMN 2: MY ADDED TRIALS --- */}
        <div className="results-column">
          <h3>My Added Trials</h3>
          {loading && ( 
          <div className="spinner-container">
            <div className="spinner" />
          </div>
            )}
          {myTrials.length === 0 && !loading && (
            <p>You have not added any trials yet.</p>
          )}
          {myTrials.map((trial) => (
            <div key={trial.id} className="result-item">
              <h4>{trial.title}</h4>
              <p><strong>ID:</strong> {trial.id} | <strong>Status:</strong> {trial.status}</p>
              <p>{trial.description}</p>
              <button onClick={() => handleEdit(trial)} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginRight: '0.5rem' }}>
                Edit
              </button>
              <button onClick={() => handleDelete(trial.id)} style={{ background: '#dc3545', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ManageTrialsPage;

