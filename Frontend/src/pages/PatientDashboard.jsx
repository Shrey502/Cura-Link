// src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api'; // Import our new api helper
import ContactModal from '../components/ContactModal';

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  
  // --- THIS LINE WAS MISSING ---
  const [loading, setLoading] = useState(true);
  // -----------------------------

  // Search State
  const [pubSearchTerm, setPubSearchTerm] = useState('');
  const [trialSearchTerm, setTrialSearchTerm] = useState('');
  const [publications, setPublications] = useState([]);
  const [trials, setTrials] = useState([]);
  const [trialStatusFilter, setTrialStatusFilter] = useState('ALL');

  // Expert State
  const [expertSearchTerm, setExpertSearchTerm] = useState('');
  const [experts, setExperts] = useState([]);

  // Forum State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  
  // New Post Form State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');

  // Popup/Modal State
  const [toastMessage, setToastMessage] = useState('');
  const [meetingRequest, setMeetingRequest] = useState(null);

  // --- 1. Fetch Profile & Categories on Page Load ---
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

    // --- UPDATED: Load all data and set loading state ---
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchCategories()
      ]);
      setLoading(false);
    };

    loadAllData();
  }, []); // Runs once on page load

  // --- 2. Search Handlers ---
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

  // --- 3. Forum Handlers ---
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
  
  // --- 4. Helper function to show toast ---
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 1500); // Show for 1.5 seconds
  };

  // --- 5. Handle Add to Favorites ---
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
  
  // --- 6. Handle Expert Search & Meeting Request ---
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
  
  const handleMeetingRequest = (expertName) => {
    setMeetingRequest({ name: expertName }); // Open the modal
  };
  
  const confirmMeetingRequest = () => {
    // In a real app, this would send an email or backend request
    // For the MVP, we just show a confirmation toast
    showToast(`Meeting request sent to ${meetingRequest.name}!`);
    setMeetingRequest(null); // Close the modal
  };

  // --- UPDATED: Use the loading state ---
  if (loading || !profile) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <> 
      {/* --- Popups & Modals --- */}
      {toastMessage && (
        <div className="toast-backdrop">
          <div className="toast-box">
            {toastMessage}
          </div>
        </div>
      )}
      
      {meetingRequest && (
        <ContactModal 
          title="Request Meeting"
          message={`Are you sure you want to request a meeting with ${meetingRequest.name}? They will be sent your contact details.`}
          onConfirm={confirmMeetingRequest}
          onCancel={() => setMeetingRequest(null)}
        />
      )}

      {/* Your existing dashboard page */}
      <div className="dashboard">
        {/* --- COLUMN 1: SEARCH & PROFILE --- */}
        <div className="search-column">
          <h2>Welcome, {profile.full_name}!</h2>
          <p>Your registered conditions: <strong>{profile.conditions?.join(', ')}</strong></p>
          
          <div className="search-box">
            <h3>Search Publications</h3>
            <form onSubmit={handleSearchPublications}>
              <input
                type="text"
                placeholder="e.g., Glioma treatment"
                value={pubSearchTerm}
                onChange={(e) => setPubSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
          </div>
          <div className="search-box ">
            <h3>Search Clinical Trials</h3>
            <form onSubmit={handleSearchTrials}>
              <input
                type="text"
                placeholder="e.g., Glioblastoma"
                value={trialSearchTerm}
                onChange={(e) => setTrialSearchTerm(e.target.value)}
                style={{ flexGrow: 1 }}
                className='search-input'
              />
              <select 
                value={trialStatusFilter} 
                onChange={(e) => setTrialStatusFilter(e.target.value)}
                style={{ flexShrink: 1 }}
                className="status-select"
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
            <form onSubmit={handleSearchExperts}>
              <input
                type="text"
                placeholder="e.g., Oncology"
                value={expertSearchTerm}
                onChange={(e) => setExpertSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>

        {/* --- COLUMN 2: FORUMS & RESULTS --- */}
        <div className="results-column">
          <h3>Community Forums</h3>
          <div className="forum-container">
            <h4>Categories</h4>
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => handleCategoryClick(cat.id)}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
              >
                {cat.name}
              </button>
            ))}
            
            <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

            {/* Ask a Question Form */}
            <form onSubmit={handlePostSubmit} className="search-box" style={{borderBottom: 'none', paddingBottom: 0}}>
              <h4>Ask a Question</h4>
              <div className="form-group" style={{marginBottom: '1rem'}}>
                <input 
                  type="text" 
                  placeholder="Your question title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{marginBottom: '1rem'}}>
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
              {!selectedCategory && <small style={{ display: 'block', color: 'red', marginTop: '0.5rem' }}>Please select a category first.</small>}
            </form>

            <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

            {/* Posts & Replies */}
            {posts.map((post) => (
              <div key={post.id} className="result-item" style={{ background: 'var(--bg-secondary)' }}>
                <h4>{post.title}</h4>
                <p>{post.body}</p>
                <small><strong>- Asked by: {post.full_name}</strong></small>
                <br/>
                <button onClick={() => handlePostClick(post.id)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}>
                  {selectedPost === post.id ? 'Hide Replies' : 'Show Replies'}
                </button>
                
                {/* Show Replies if this post is selected */}
                {selectedPost === post.id && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    {replies.length > 0 ? (
                      replies.map(reply => (
                        <div key={reply.id} style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <p style={{margin: 0}}>{reply.body}</p>
                          <small><strong>- Answered by: {reply.full_name}</strong></small>
                        </div>
                      ))
                    ) : (
                      <p>No answers yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* --- SEARCH RESULTS SECTION --- */}
          <h3 style={{ marginTop: '2rem' }}>Publication Results</h3>
          {publications.map((pub) => (
            <div key={pub.id} className="result-item">
              <h4>{pub.title}</h4>
              <p><strong>AI Summary:</strong> {pub.ai_summary}</p>
              <a href={pub.publication_url} target="_blank" rel="noopener noreferrer" style={{ marginRight: '1rem' }}>Read More</a>
              <button 
                onClick={() => handleFavorite(pub.id, 'PUBLICATION')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                + Favorite
              </button>
            </div>
          ))}

          <h3 style={{ marginTop: '2rem' }}>Clinical Trial Results</h3>
          {trials.map((trial) => (
            <div key={trial.id} className="result-item">
              <h4>{trial.title}</h4>
              <p><strong>Status:</strong> {trial.status}</p>
              <p><strong>AI Summary:</strong> {trial.ai_summary}</p>
              {trial.contact_email && trial.contact_email !== 'N/A' && (
                <a 
                  href={`mailto:${trial.contact_email}?subject=Question about trial ${trial.id}`} 
                  style={{ marginRight: '1rem', fontSize: '0.9rem' }}
                >
                  Contact Trial
                </a>
              )}
              <a href={trial.trial_url} target="_blank" rel="noopener noreferrer" style={{ marginRight: '1rem' }}>View Trial</a>
              <button 
                onClick={() => handleFavorite(trial.id, 'TRIAL')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                + Favorite
              </button>
            </div>
          ))}
          
          <h3 style={{ marginTop: '2rem' }}>Health Expert Results</h3>
          {experts.map((expert) => (
            <div key={expert.user_id} className="result-item">
              <h4>{expert.full_name}</h4>
              <p><strong>Specialties:</strong> {expert.specialties?.join(', ')}</p>
              <p><strong>Interests:</strong> {expert.research_interests?.join(', ')}</p>
              
              <button 
                onClick={() => handleFavorite(expert.user_id, 'EXPERT')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                + Favorite
              </button>
              
              <button 
                onClick={() => handleMeetingRequest(expert.full_name)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
              >
                Request Meeting
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default PatientDashboard;

