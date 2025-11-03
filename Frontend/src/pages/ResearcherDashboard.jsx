// src/pages/ResearcherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ContactModal from '../components/ContactModal';

// --- SessionStorage Keys (for state persistence) ---
const SESSION_KEYS = {
  COLLAB_SEARCH_TERM: 'rd_collabSearchTerm',
  COLLABORATORS: 'rd_collaborators',
  CATEGORIES: 'rd_categories',
  SELECTED_CATEGORY: 'rd_selectedCategory',
  POSTS: 'rd_posts',
  SELECTED_POST: 'rd_selectedPost',
  REPLIES: 'rd_replies',
  PENDING_REQUESTS: 'rd_pendingRequests',
  ACCEPTED_COLLABS: 'rd_acceptedCollabs',
  SENT_REQUESTS: 'rd_sentRequests',
};

// --- Helper function to get state from sessionStorage ---
const getInitialState = (key, defaultValue) => {
  const storedValue = sessionStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue);
    } catch (e) {
      console.error(`Failed to parse sessionStorage key "${key}":`, e);
      return defaultValue;
    }
  }
  return defaultValue;
};


function ResearcherDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Forum State
  const [categories, setCategories] = useState(() => getInitialState(SESSION_KEYS.CATEGORIES, []));
  const [selectedCategory, setSelectedCategory] = useState(() => getInitialState(SESSION_KEYS.SELECTED_CATEGORY, null));
  const [posts, setPosts] = useState(() => getInitialState(SESSION_KEYS.POSTS, []));
  const [selectedPost, setSelectedPost] = useState(() => getInitialState(SESSION_KEYS.SELECTED_POST, null));
  const [replies, setReplies] = useState(() => getInitialState(SESSION_KEYS.REPLIES, []));
  const [replyBody, setReplyBody] = useState('');
  
  // --- NEW: Create Category State ---
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');


  // Collaborator State
  const [collabSearchTerm, setCollabSearchTerm] = useState(() => getInitialState(SESSION_KEYS.COLLAB_SEARCH_TERM, ''));
  const [collaborators, setCollaborators] = useState(() => getInitialState(SESSION_KEYS.COLLABORATORS, []));
  
  // Connection & Chat State
  const [pendingRequests, setPendingRequests] = useState(() => getInitialState(SESSION_KEYS.PENDING_REQUESTS, []));
  const [acceptedCollabs, setAcceptedCollabs] = useState(() => getInitialState(SESSION_KEYS.ACCEPTED_COLLABS, []));
  const [sentRequests, setSentRequests] = useState(() => getInitialState(SESSION_KEYS.SENT_REQUESTS, []));
  
  const [toastMessage, setToastMessage] = useState('');
  const [connectRequest, setConnectRequest] = useState(null); 

  // --- 1. Fetch ALL data on page load ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/researcher');
        setProfile(response.data.profile);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Could not fetch your profile.');
      }
    };
    
    const fetchCategories = async () => {
      if (categories.length > 0 && sessionStorage.getItem(SESSION_KEYS.CATEGORIES)) return; // Don't refetch if we have it
      try {
        const response = await api.get('/forums');
        setCategories(response.data);
        sessionStorage.setItem(SESSION_KEYS.CATEGORIES, JSON.stringify(response.data));
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };

    const fetchConnections = async () => {
      try {
        const [pendingRes, acceptedRes] = await Promise.all([
          api.get('/connections/pending'),
          api.get('/connections/accepted')
        ]);
        
        setPendingRequests(pendingRes.data);
        sessionStorage.setItem(SESSION_KEYS.PENDING_REQUESTS, JSON.stringify(pendingRes.data));
        
        setAcceptedCollabs(acceptedRes.data);
        sessionStorage.setItem(SESSION_KEYS.ACCEPTED_COLLABS, JSON.stringify(acceptedRes.data));
        
      } catch (err) {
        console.error('Failed to fetch connections', err);
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchCategories(),
        fetchConnections()
      ]);
      setLoading(false);
    };

    loadAllData();
  }, []); // Runs once on page load

  // --- 2. Forum Handlers (UPDATED to save state) ---
  const handleCategoryClick = async (categoryId) => {
    setSelectedCategory(categoryId);
    sessionStorage.setItem(SESSION_KEYS.SELECTED_CATEGORY, JSON.stringify(categoryId));
    
    setSelectedPost(null);
    sessionStorage.removeItem(SESSION_KEYS.SELECTED_POST);
    
    setReplies([]);
    sessionStorage.removeItem(SESSION_KEYS.REPLIES); 
    
    try {
      const response = await api.get(`/forums/posts/${categoryId}`);
      setPosts(response.data);
      sessionStorage.setItem(SESSION_KEYS.POSTS, JSON.stringify(response.data));
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };

  const handlePostClick = async (postId) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
      sessionStorage.removeItem(SESSION_KEYS.SELECTED_POST);
      setReplies([]);
      sessionStorage.removeItem(SESSION_KEYS.REPLIES);
    } else {
      setSelectedPost(postId);
      sessionStorage.setItem(SESSION_KEYS.SELECTED_POST, JSON.stringify(postId));
      try {
        const response = await api.get(`/forums/replies/${postId}`);
        setReplies(response.data);
        sessionStorage.setItem(SESSION_KEYS.REPLIES, JSON.stringify(response.data));
      } catch (err) {
        console.error('Failed to fetch replies', err);
      }
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/forums/replies', {
        body: replyBody,
        postId: selectedPost,
      });
      const newReplies = [...replies, response.data];
      setReplies(newReplies);
      sessionStorage.setItem(SESSION_KEYS.REPLIES, JSON.stringify(newReplies));
      setReplyBody('');
    } catch (err) {
      console.error('Failed to post reply', err);
    }
  };

  // --- NEW: Create Category Handler ---
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName || !newCategoryDesc) {
      setError('Please fill out both name and description.');
      return;
    }
    try {
      const response = await api.post('/forums/categories', {
        name: newCategoryName,
        description: newCategoryDesc
      });
      // Add new category to the list and save to session
      const newCategories = [...categories, response.data];
      setCategories(newCategories);
      sessionStorage.setItem(SESSION_KEYS.CATEGORIES, JSON.stringify(newCategories));
      // Clear the form
      setNewCategoryName('');
      setNewCategoryDesc('');
      setError('');
    } catch (err) {
      console.error('Failed to create category', err);
      setError('Failed to create category. Please try again.');
    }
  };
  
  // --- 3. Collaborator & Connection Handlers (UPDATED) ---
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 1500);
  };
  
  const handleCollabSearchTermChange = (e) => {
    setCollabSearchTerm(e.target.value);
    sessionStorage.setItem(SESSION_KEYS.COLLAB_SEARCH_TERM, JSON.stringify(e.target.value));
  };

  const handleSearchCollaborators = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/search/experts', { searchTerm: collabSearchTerm });
      // Filter out ourself, and anyone we're already connected to
      const myCollabIds = acceptedCollabs.map(c => c.collaborator_id);
      const otherResearchers = response.data.filter(
        r => r.user_id !== profile?.user_id && !myCollabIds.includes(r.user_id)
      );
      setCollaborators(otherResearchers);
      sessionStorage.setItem(SESSION_KEYS.COLLABORATORS, JSON.stringify(otherResearchers));
    } catch (err) {
      console.error('Collaborator search failed', err);
      setError('Search for collaborators failed.');
    }
  };
  
  const handleFavorite = async (itemId) => {
    try {
      await api.post('/favorites', { itemId, itemType: 'EXPERT' });
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
  
  const handleConnectRequest = (researcherName, researcherId) => {
    setConnectRequest({ name: researcherName, id: researcherId }); 
  };
  
  const confirmConnectRequest = async () => {
    try {
      await api.post('/connections/request', { recipientId: connectRequest.id });
      showToast(`Connection request sent to ${connectRequest.name}!`);
      
      const newSentRequests = [...sentRequests, connectRequest.id];
      setSentRequests(newSentRequests);
      sessionStorage.setItem(SESSION_KEYS.SENT_REQUESTS, JSON.stringify(newSentRequests));
    } catch (err) {
      console.error('Failed to send request', err);
      if (err.response && err.response.status === 409) {
        showToast('Request already sent.');
        // Add to sent requests even if it failed (as it's already sent)
        const newSentRequests = [...sentRequests, connectRequest.id];
        setSentRequests(newSentRequests);
        sessionStorage.setItem(SESSION_KEYS.SENT_REQUESTS, JSON.stringify(newSentRequests));
      } else {
        showToast('Failed to send request.');
      }
    } finally {
      setConnectRequest(null);
    }
  };

  const handleRequestResponse = async (requestId, response) => {
    try {
      await api.put('/connections/respond', { requestId, response });
      
      const newPending = pendingRequests.filter(req => req.id !== requestId);
      setPendingRequests(newPending);
      sessionStorage.setItem(SESSION_KEYS.PENDING_REQUESTS, JSON.stringify(newPending));

      if (response === 'ACCEPTED') {
        const acceptedRes = await api.get('/connections/accepted');
        setAcceptedCollabs(acceptedRes.data);
        sessionStorage.setItem(SESSION_KEYS.ACCEPTED_COLLABS, JSON.stringify(acceptedRes.data));
      }

      showToast(`Request ${response.toLowerCase()}.`);
    } catch (err) {
      console.error('Failed to respond to request', err);
      showToast('Failed to respond to request.');
    }
  };

  const handleStartChat = async (collaboratorId, collaboratorName) => {
    try {
      const response = await api.post('/chat/rooms', { otherUserId: collaboratorId });
      const room = response.data;
      navigate('/chat', { state: { roomId: room.id, roomName: collaboratorName } });
    } catch (err) {
      console.error('Failed to start chat', err);
      showToast('Could not start chat.');
    }
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
      {/* --- Popups & Modals --- */}
      {toastMessage && (
        <div className="toast-backdrop">
          <div className="toast-box">{toastMessage}</div>
        </div>
      )}
      
      {connectRequest && (
        <ContactModal 
          title="Send Connection Request"
          message={`Are you sure you want to send a connection request to ${connectRequest.name}?`}
          onConfirm={confirmConnectRequest}
          onCancel={() => setConnectRequest(null)}
        />
      )}
      
      {/* --- Main Dashboard --- */}
      <div className="dashboard">
        {/* --- COLUMN 1: PROFILE, CONNECTIONS, FORUM NAV --- */}
        <div className="search-column">
          <h2>Welcome, {profile.full_name}</h2>
          <p>Your specialties: <strong>{profile.specialties?.join(', ')}</strong></p>
          
          <div className="search-box" style={{ marginTop: '2rem' }}>
            <h3>Pending Connection Requests</h3>
            {pendingRequests.length === 0 ? (
              <p>No new requests.</p>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="result-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span><strong>{req.requester_name}</strong> wants to connect.</span>
                  <div>
                    <button onClick={() => handleRequestResponse(req.id, 'ACCEPTED')} className="btn btn-success" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginRight: '0.5rem' }}>Accept</button>
                    <button onClick={() => handleRequestResponse(req.id, 'REJECTED')} className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="search-box" style={{ marginTop: '2rem' }}>
            <h3>Search Collaborators</h3>
            <form onSubmit={handleSearchCollaborators}>
              <input
                type="text"
                placeholder="e.g., Oncology"
                value={collabSearchTerm}
                onChange={handleCollabSearchTermChange}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
          </div>
          
          {error && <p className="error-message">{error}</p>}

          <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

          <h3>Forum Management</h3>
          
          {/* --- UPDATED: Create Category Form --- */}
          <form onSubmit={handleCreateCategory} className="form-container-animate" style={{ padding: 0, border: 'none', boxShadow: 'none', background: 'none' }}>
            <h4 style={{marginTop: 0}}>Create New Category</h4>
            
            <div className="form-group" style={{marginBottom: '1rem'}}>
              <label htmlFor="cat-name">Category Name</label>
              <input 
                id="cat-name"
                type="text"
                placeholder="e.g., Cardiology Research"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{marginBottom: '1rem'}}>
              <label htmlFor="cat-desc">Description</label>
              <input 
                id="cat-desc"
                type="text"
                placeholder="A short description..."
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Create Category</button>
          </form>
          {/* --- End New Form --- */}

          <h4 style={{ marginTop: '1.5rem' }}>Categories</h4>
          <div>
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
          </div>

          <h4 style={{ marginTop: '1.5rem' }}>Patient Questions</h4>
          <div>
            {posts.length > 0 ? (
              posts.map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => handlePostClick(post.id)}
                  className="result-item"
                  style={{ cursor: 'pointer', background: selectedPost === post.id ? 'var(--bg-secondary)' : 'var(--bg-card)' }}
                >
                  <strong>{post.title}</strong>
                  <br />
                  <small>Asked by: {post.full_name}</small>
                </div>
              ))
            ) : (
              <p>{selectedCategory ? 'No questions in this category yet.' : 'Select a category to see questions.'}</p>
            )}
          </div>
        </div>

        {/* --- COLUMN 2: COLLABORATORS & FORUM REPLIES --- */}
        <div className="results-column">
          <h3>My Collaborators</h3>
          {acceptedCollabs.length > 0 ? (
            acceptedCollabs.map((collab) => (
              <div key={collab.collaborator_id} className="result-item">
                <h4>{collab.collaborator_name}</h4>
                <button 
                  onClick={() => handleStartChat(collab.collaborator_id, collab.collaborator_name)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                >
                  Chat
                </button>
              </div>
            ))
          ) : (
            <p>No collaborators yet. Find them in the search below.</p>
          )}

          <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          
          <h3>Collaborator Search Results</h3>
          {collaborators.length > 0 ? (
            collaborators.map((expert) => (
              <div key={expert.user_id} className="result-item">
                <h4>{expert.full_name}</h4>
                <p><strong>Specialties:</strong> {expert.specialties?.join(', ')}</p>
                <p><strong>Interests:</strong> {expert.research_interests?.join(', ')}</p>
                
                <button 
                  onClick={() => handleFavorite(expert.user_id)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                >
                  + Favorite
                </button>

                {sentRequests.includes(expert.user_id) ? (
                  <button 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem', cursor: 'not-allowed' }}
                    disabled
                  >
                    Request Sent
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnectRequest(expert.full_name, expert.user_id)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
                  >
                    Connect
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No collaborators found. Try a new search.</p>
          )}

          <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          
          <h3>Question & Answers</h3>
          {!selectedPost && <p>Select a question to see the discussion.</p>}

          {selectedPost && (
            <div>
              {/* Find the original post title */}
              <h4>{posts.find(p => p.id === selectedPost)?.title}</h4>
              <p style={{ fontStyle: 'italic' }}>{posts.find(p => p.id === selectedPost)?.body}</p>
              <hr />
              {replies.length > 0 ? (
                replies.map((reply) => (
                  <div key={reply.id} className="result-item" style={{ background: 'var(--bg-secondary)' }}>
                    <p>{reply.body}</p>
                    <small>Answered by: {reply.full_name}</small>
                  </div>
                ))
              ) : (
                <p>No answers yet. Be the first to reply!</p>
              )}
              
              <form onSubmit={handleReplySubmit} style={{ marginTop: '1.5rem' }}>
                <h4>Your Answer</h4>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows="5"
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Post Reply
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ResearcherDashboard;

