// src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api'; // Import our new api helper
import ContactModal from '../components/ContactModal'; // <-- IMPORT THE NEW MODAL

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  // Search State
  const [pubSearchTerm, setPubSearchTerm] = useState(''); // Renamed
  const [trialSearchTerm, setTrialSearchTerm] = useState(''); // Renamed
  const [publications, setPublications] = useState([]);
  const [trials, setTrials] = useState([]);
  const [trialStatusFilter, setTrialStatusFilter] = useState('ALL'); // <-- NEW

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
  const [meetingRequest, setMeetingRequest] = useState(null); // <-- NEW MODAL STATE

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

    fetchProfile();
    fetchCategories();
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

  // --- UPDATED: Search Trials with Filter ---
  const handleSearchTrials = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/trials', { 
        searchTerm: trialSearchTerm,
        statusFilter: trialStatusFilter // <-- Pass the filter
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
      setPosts([response.data, ...posts]); // Add new post to the top
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
  
  // --- NEW: Handle Meeting Request ---
  const handleMeetingRequest = (expertName) => {
    setMeetingRequest({ name: expertName }); // Open the modal
  };
  
  const confirmMeetingRequest = () => {
    // In a real app, this would send an email or backend request
    // For the MVP, we just show a confirmation toast
    showToast(`Meeting request sent to ${meetingRequest.name}!`);
    setMeetingRequest(null); // Close the modal
  };

  if (!profile) return <div>Loading your profile...</div>;

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
      
      {/* --- NEW: Meeting Request Modal --- */}
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
          
          {/* Publication Search */}
          <div className="search-box">
            <h3>Search Publications</h3>
            <form onSubmit={handleSearchPublications}>
              <input
                type="text"
                placeholder="e.g., Glioma treatment"
                value={pubSearchTerm}
                onChange={(e) => setPubSearchTerm(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>

          {/* --- UPDATED: Trial Search with Filter --- */}
          <div className="search-box">
            <h3>Search Clinical Trials</h3>
            <form onSubmit={handleSearchTrials}>
              <input
                type="text"
                placeholder="e.g., Glioblastoma"
                value={trialSearchTerm}
                onChange={(e) => setTrialSearchTerm(e.target.value)}
              />
              <select 
                value={trialStatusFilter} 
                onChange={(e) => setTrialStatusFilter(e.target.value)}
                style={{ marginLeft: '0.5rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="RECRUITING">RECRUITING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="NOT_YET_RECRUITING">NOT_YET_RECRUITING</option>
              </select>
              <button type="submit">Search</button>
            </form>
          </div>
          
          {/* Expert Search */}
          <div className="search-box">
            <h3>Search Health Experts</h3>
            <form onSubmit={handleSearchExperts}>
              <input
                type="text"
                placeholder="e.g., Oncology"
                value={expertSearchTerm}
                onChange={(e) => setExpertSearchTerm(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>

        {/* --- COLUMN 2: FORUMS & RESULTS --- */}
        <div className="results-column">

          {/* --- FORUM SECTION --- */}
          <h3>Community Forums</h3>
          <div className="forum-container">
            <h4>Categories</h4>
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => handleCategoryClick(cat.id)}
                style={{ marginRight: '0.5rem', marginBottom: '0.5rem', background: selectedCategory === cat.id ? '#007bff' : '#eee', color: selectedCategory === cat.id ? '#fff' : '#000' }}
              >
                {cat.name}
              </button>
            ))}
            
            <hr />

            {/* Ask a Question Form */}
            <form onSubmit={handlePostSubmit}>
              <h4>Ask a Question</h4>
              <input 
                type="text" 
                placeholder="Your question title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <textarea
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                rows="3"
                placeholder="Type your question here..."
                required
                style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.5rem' }}
              />
              <button type="submit" disabled={!selectedCategory} style={{ marginTop: '0.5rem' }}>
                Post to {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '...'}
              </button>
              {!selectedCategory && <small style={{ display: 'block', color: 'red', marginTop: '0.5rem' }}>Please select a category first.</small>}
            </form>

            <hr />

            {/* Posts & Replies */}
            {posts.map((post) => (
              <div key={post.id} className="result-item" style={{ background: '#f9f9f9' }}>
                <h4>{post.title}</h4>
                <p>{post.body}</p>
                <small><strong>- Asked by: {post.full_name}</strong></small>
                <br/>
                <button onClick={() => handlePostClick(post.id)} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}>
                  {selectedPost === post.id ? 'Hide Replies' : 'Show Replies'}
                </button>
                
                {/* Show Replies if this post is selected */}
                {selectedPost === post.id && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                    {replies.length > 0 ? (
                      replies.map(reply => (
                        <div key={reply.id} style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <p>{reply.body}</p>
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
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#6c757d' }}
              >
                + Favorite
              </button>
            </div>
          ))}

          {/* --- UPDATED: Trial Results with Email --- */}
          <h3 style={{ marginTop: '2rem' }}>Clinical Trial Results</h3>
          {trials.map((trial) => (
            <div key={trial.id} className="result-item">
              <h4>{trial.title}</h4>
              <p><strong>Status:</strong> {trial.status}</p>
              <p><strong>AI Summary:</strong> {trial.ai_summary}</p>
              {/* --- NEW: Clickable Email --- */}
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
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#6c757d' }}
              >
                + Favorite
              </button>
            </div>
          ))}
          
          {/* --- UPDATED: Expert Results --- */}
          <h3 style={{ marginTop: '2rem' }}>Health Expert Results</h3>
          {experts.map((expert) => (
            <div key={expert.user_id} className="result-item">
              <h4>{expert.full_name}</h4>
              {/* --- THIS IS THE FIX --- */}
              <p>
                <strong>Specialties:</strong> {expert.specialties?.join(', ')} <br/>
                <strong>Interests:</strong> {expert.research_interests?.join(', ')}
              </p>
              {/* --- END OF FIX --- */}
              
              <button 
                onClick={() => handleFavorite(expert.user_id, 'EXPERT')}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#6c757d' }}
              >
                + Favorite
              </button>
              
              {/* --- NEW: Request Meeting Button --- */}
              <button 
                onClick={() => handleMeetingRequest(expert.full_name)}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#007bff', marginLeft: '0.5rem' }}
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

