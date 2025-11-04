// src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import api from '../api';
import ContactModal from '../components/ContactModal';

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [pubSearchTerm, setPubSearchTerm] = useState('');
  const [trialSearchTerm, setTrialSearchTerm] = useState('');
  const [publications, setPublications] = useState([]);
  const [trials, setTrials] = useState([]);
  const [trialStatusFilter, setTrialStatusFilter] = useState('ALL');

  const [expertSearchTerm, setExpertSearchTerm] = useState('');
  const [experts, setExperts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [meetingRequest, setMeetingRequest] = useState(null);
  
  // --- NEW: Notifications State ---
  const [meetingUpdates, setMeetingUpdates] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/patient');
        setProfile(response.data.profile);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Could not fetch your profile.');
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await api.get('/forums');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    
    // --- Fetches accepted meeting requests ---
    const fetchMeetingUpdates = async () => {
      try {
        const response = await api.get('/meetings/updates');
        setMeetingUpdates(response.data);
      } catch (err) {
        console.error('Failed to fetch meeting updates', err);
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(), 
        fetchCategories(),
        fetchMeetingUpdates() // <-- Fetches notifications
      ]);
      setLoading(false);
    };

    loadAllData();
  }, []);

  const handleSearchPublications = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/publications', { searchTerm: pubSearchTerm });
      setPublications(response.data);
    } catch (err) {
      console.error('Search failed', err);
      setError('Search for publications failed.');
    }
  };

  const handleSearchTrials = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/trials', {
        searchTerm: trialSearchTerm,
        statusFilter: trialStatusFilter
      });
      setTrials(response.data);
    } catch (err) {
      console.error('Search failed', err);
      setError('Search for trials failed.');
    }
  };

  const handleSearchExperts = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/experts', { searchTerm: expertSearchTerm });
      setExperts(response.data);
    } catch (err) {
      console.error('Expert search failed', err);
      setError('Search for experts failed.');
    }
  };

  const handleCategoryClick = async (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedPost(null);
    setReplies([]);
    try {
      const response = await api.get(`/forums/posts/${categoryId}`);
      setPosts(response.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };

  const handlePostClick = async (postId) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
      setReplies([]);
    } else {
      setSelectedPost(postId);
      try {
        const response = await api.get(`/forums/replies/${postId}`);
        setReplies(response.data);
      } catch (err) {
        console.error('Failed to fetch replies', err);
      }
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError("Please select a category before posting.");
      return;
    }
    try {
      const response = await api.post('/forums/posts', {
        title: newPostTitle,
        body: newPostBody,
        communityId: selectedCategory,
      });
      setPosts([response.data, ...posts]);
      setNewPostTitle('');
      setNewPostBody('');
    } catch (err) {
      console.error('Failed to create post', err);
      setError('Could not submit your question.');
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 1500);
  };

  const handleFavorite = async (itemId, itemType) => {
    try {
      await api.post('/favorites', { itemId, itemType });
      showToast('Added to favorites!');
    } catch (err) {
      console.error('Failed to add favorite', err);
      if (err.response && err.response.status === 409) {
        showToast('Item is already in your favorites.');
      } else {
        showToast('Could not add to favorites.');
      }
    }
  };

  // --- UPDATED: Now passes the full expert object ---
  const handleMeetingRequest = (expert) => {
    setMeetingRequest(expert); // Open the modal
  };

  // --- UPDATED: Now sends a real API request ---
  const confirmMeetingRequest = async () => {
    if (!meetingRequest) return;
    
    try {
      // This is the real API call
      await api.post('/meetings/request', { researcherId: meetingRequest.user_id });
      showToast(`Meeting request sent to ${meetingRequest.full_name}!`);
    } catch (err) {
       console.error('Failed to send request', err);
      if (err.response && err.response.status === 409) {
        showToast('Request already sent.');
      } else {
        showToast('Failed to send request.');
      }
    }
    setMeetingRequest(null);
  };

  if (loading || !profile) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="toast-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="toast-box"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
            >
              {toastMessage}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {meetingRequest && (
        <ContactModal
          title="Request Meeting"
          message={`Are you sure you want to request a meeting with ${meetingRequest.full_name}?`}
          onConfirm={confirmMeetingRequest}
          onCancel={() => setMeetingRequest(null)}
        />
      )}

      <motion.div
        className="dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55 }}
      >
        <motion.div
          className="search-column"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
        >
          <h2>Welcome, {profile.full_name}!</h2>
          <p>Your registered conditions: <strong>{profile.conditions?.join(', ')}</strong></p>

          {/* --- NEW: NOTIFICATIONS --- */}
          <div className="search-box" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ border: 'none', marginBottom: '0.5rem' }}>Notifications</h3>
            {meetingUpdates.length === 0 ? (
              <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>No new updates.</p>
            ) : (
              meetingUpdates.map(update => (
                <div key={update.id} className="result-item" style={{background: 'var(--bg-card)'}}>
                  <p style={{margin: 0, fontSize: '0.9rem'}}>
                    Your meeting request with <strong>{update.researcher_name}</strong> was accepted!
                  </p>
                  <a href={`mailto:${update.researcher_email}`} className="btn-primary" style={{
                    fontSize: '0.8rem', 
                    padding: '0.25rem 0.5rem', 
                    textDecoration: 'none', 
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    display: 'inline-block'
                  }}>
                    Contact: {update.researcher_email}
                  </a>
                </div>
              ))
            )}
          </div>
          {/* --- END NOTIFICATIONS --- */}


          <div className="search-box">
            <h3>Search Publications</h3>
            <form onSubmit={handleSearchPublications} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="search-input"
                placeholder="e.g., Glioma treatment"
                value={pubSearchTerm}
                onChange={(e) => setPubSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary search-btn">Search</button>
            </form>
          </div>

          <div className="search-box ">
            <h3>Search Clinical Trials</h3>
            <form onSubmit={handleSearchTrials} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                className="search-input"
                placeholder="e.g., Glioblastoma"
                value={trialSearchTerm}
                onChange={(e) => setTrialSearchTerm(e.target.value)}
              />
              <select
                className="status-select"
                value={trialStatusFilter}
                onChange={(e) => setTrialStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="RECRUITING">Recruiting</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <button type="submit" className="btn btn-primary search-btn">Search</button>
            </form>
          </div>

          <div className="search-box">
            <h3>Search Health Experts</h3>
            <form onSubmit={handleSearchExperts} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="search-input"
                placeholder="e.g., Oncology"
                value={expertSearchTerm}
                onChange={(e) => setExpertSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary search-btn">Search</button>
            </form>
          </div>

          {error && <p className="error-message">{error}</p>}
        </motion.div>

        <motion.div
          className="results-column"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
        >
          <h3>Community Forums</h3>
          <div className="forum-container">
            <h4>Categories</h4>
            <div style={{ marginBottom: '1rem' }}>
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
                >
                  {cat.name}
                </motion.button>
              ))}
            </div>

            <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-primary)' }} />

            <form onSubmit={handlePostSubmit} className="search-box" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h4>Ask a Question</h4>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Your question title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <textarea
                  value={newPostBody}
                  onChange={(e) => setNewPostBody(e.target.value)}
                  rows="3"
                  placeholder="Type your question here..."
                  required
                />
              </div>
              <button type="submit" disabled={!selectedCategory} className="btn btn-primary" style={{ width: '100%' }}>
                Post to {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '...'}
              </button>
              {!selectedCategory && <small style={{ display: 'block', marginTop: '0.5rem' }} className="please">Please select a category first.</small>}
            </form>

            <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-primary)' }} />

            {posts.map((post) => (
              <motion.div key={post.id} className="result-item" style={{ background: 'var(--bg-secondary)' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h4>{post.title}</h4>
                <p>{post.body}</p>
                <small><strong>- Asked by: {post.full_name}</strong></small>
                <br />
                <button onClick={() => handlePostClick(post.id)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}>
                  {selectedPost === post.id ? 'Hide Replies' : 'Show Replies'}
                </button>

                {selectedPost === post.id && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1rem' }}>
                    {replies.length > 0 ? (
                      replies.map(reply => (
                        <div key={reply.id} style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <p style={{ margin: 0 }}>{reply.body}</p>
                          <small><strong>- Answered by: {reply.full_name}</strong></small>
                        </div>
                      ))
                    ) : (
                      <p>No answers yet.</p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <h3 style={{ marginTop: '2rem' }}>Publication Results</h3>
          {publications.map((pub) => (
            <motion.div key={pub.id} className="result-item" whileHover={{ scale: 1.02 }}>
              <h4>{pub.title}</h4>
              <p><strong>AI Summary:</strong> {pub.ai_summary}</p>
              <a href={pub.publication_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary link-btn" style={{ marginRight: '0.75rem' }}>Read More</a>
              <button onClick={() => handleFavorite(pub.id, 'PUBLICATION')} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>+ Favorite</button>
            </motion.div>
          ))}

          <h3 style={{ marginTop: '2rem' }}>Clinical Trial Results</h3>
          {trials.map((trial) => (
            <motion.div key={trial.id} className="result-item" whileHover={{ scale: 1.02 }}>
              <h4>{trial.title}</h4>
              <p><strong>Status:</strong> {trial.status}</p>
              <p><strong>AI Summary:</strong> {trial.ai_summary}</p>
              {trial.contact_email && trial.contact_email !== 'N/A' && (
                <a href={`mailto:${trial.contact_email}?subject=Question about trial ${trial.id}`} className="btn btn-secondary link-btn" style={{ marginRight: '0.75rem' }}>Contact Trial</a>
              )}
              <a href={trial.trial_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary link-btn" style={{ marginRight: '0.75rem' }}>View Trial</a>
              <button onClick={() => handleFavorite(trial.id, 'TRIAL')} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>+ Favorite</button>
            </motion.div>
          ))}

          <h3 style={{ marginTop: '2rem' }}>Health Expert Results</h3>
          {experts.map((expert) => (
            <motion.div key={expert.user_id} className="result-item" whileHover={{ scale: 1.02 }}>
              <h4>{expert.full_name}</h4>
              <p><strong>Specialties:</strong> {expert.specialties?.join(', ')}</p>
              <p><strong>Interests:</strong> {expert.research_interests?.join(', ')}</p>

              <button onClick={() => handleFavorite(expert.user_id, 'EXPERT')} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>+ Favorite</button>

              <button 
                onClick={() => handleMeetingRequest(expert)} // <-- UPDATED
                className="btn btn-primary" 
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
              >
                Request Meeting
              </button>
            </motion.div>
          ))}

        </motion.div>
      </motion.div>
    </>
  );
}

export default PatientDashboard;

