// src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api'; // Import our new api helper

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [publications, setPublications] = useState([]);
  const [trials, setTrials] = useState([]);

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

  // --- NEW: Popup Toast State ---
  const [toastMessage, setToastMessage] = useState('');

  // --- 1. Fetch Profile & Categories on Page Load ---
  useEffect(() => {
    // ... (Your existing useEffect code is perfect, no changes needed) ...
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
  }, []);

  // --- 2. Search Handlers ---
  // ... (Your search handlers are perfect, no changes needed) ...
  const handleSearchPublications = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/search/publications', { searchTerm });
      setPublications(response.data);
    } catch (err) {
      console.error('Search failed', err);
      setError('Search for publications failed.');
    }
  };

  const handleSearchTrials = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/search/trials', { searchTerm });
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

  // --- 3. Forum Handlers ---
  // ... (Your forum handlers are perfect, no changes needed) ...
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


  // --- 4. UPDATED: Handle Add to Favorites ---
  const handleFavorite = async (itemId, itemType) => {
    try {
      await api.post('/favorites', { itemId, itemType });
      
      // --- This replaces alert() ---
      setToastMessage('Added to favorites!');
      setTimeout(() => setToastMessage(''), 2000); // Hide after 1 second
      
    } catch (err) {
      console.error('Failed to add favorite', err);
      
      // --- This also replaces alert() ---
      if (err.response && err.response.status === 409) {
        setToastMessage('Item is already in your favorites.');
      } else {
        setToastMessage('Could not add to favorites.');
      }
      setTimeout(() => setToastMessage(''), 2000); // Hide after 1 second
    }
  };


  if (!profile) return <div>Loading your profile...</div>;

  return (
    // We add a React.Fragment (empty <>) to allow the popup to be a sibling
    <> 
      {/* --- NEW: This is the Popup --- */}
      {toastMessage && (
        <div className="toast-backdrop">
          <div className="toast-box">
            {toastMessage}
          </div>
        </div>
      )}

      {/* This is your existing dashboard content */}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>

          {/* Trial Search */}
          <div className="search-box">
            <h3>Search Clinical Trials</h3>
            <form onSubmit={handleSearchTrials}>
              <input
                type="text"
                placeholder="e.g., Glioblastoma"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">Search</button>
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
              <button type="submit">Search</button>
            </form>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>

        {/* --- COLUMN 2: FORUMS & RESULTS --- */}
        <div className="results-column">
          {/* --- FORUM SECTION --- */}
          <h3>Community Forums</h3>
          {/* ... (Your forum JSX is perfect, no changes needed) ... */}
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
            {posts.map((post) => (
              <div key={post.id} className="result-item" style={{ background: '#f9f9f9' }}>
                <h4>{post.title}</h4>
                <p>{post.body}</p>
                <small><strong>- Asked by: {post.full_name}</strong></small>
                <br/>
                <button onClick={() => handlePostClick(post.id)} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}>
                  {selectedPost === post.id ? 'Hide Replies' : 'Show Replies'}
                </button>
                
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

          <h3 style={{ marginTop: '2rem' }}>Clinical Trial Results</h3>
          {trials.map((trial) => (
            <div key={trial.id} className="result-item">
              <h4>{trial.title}</h4>
              <p><strong>Status:</strong> {trial.status}</p>
              <p><strong>AI Summary:</strong> {trial.ai_summary}</p>
              <a href={trial.trial_url} target="_blank" rel="noopener noreferrer" style={{ marginRight: '1Frem' }}>View Trial</a>
              <button 
                onClick={() => handleFavorite(trial.id, 'TRIAL')}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#6c757d' }}
              >
                + Favorite
              </button>
            </div>
          ))}
            {/* --- NEW: Expert Results --- */}
          <h3 style={{ marginTop: '2rem' }}>Health Expert Results</h3>
          {experts.map((expert) => (
            <div key={expert.user_id} className="result-item">
              <h4>{expert.full_name}</h4>
              <p><strong>Specialties:</strong> {expert.specialties?.join(', ')}</p>
              <p><strong>Interests:</strong> {expert.research_interests?.join(', ')}</p>

              {/* We use 'expert.user_id' for favoriting */}
              <button 
                onClick={() => handleFavorite(expert.user_id, 'EXPERT')}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#6c757d' }}
              >
                + Favorite
              </button>
            </div>
          ))}
        </div>
      </div>
    </> // End of the React.Fragment
  );
}

export default PatientDashboard;