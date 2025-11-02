// src/pages/ResearcherDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api'; // Import our api helper

function ResearcherDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  
  // Forum State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyBody, setReplyBody] = useState('');

  // Collaborator State
  const [collabSearchTerm, setCollabSearchTerm] = useState('');
  const [collaborators, setCollaborators] = useState([]);

  // --- 1. Fetch Profile on Page Load ---
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

    // --- 2. Fetch Forum Categories on Page Load ---
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

  // --- 3. Fetch Posts when a Category is Clicked ---
  const handleCategoryClick = async (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedPost(null); // Clear old post
    setReplies([]); // Clear old replies
    try {
      const response = await api.get(`/forums/posts/${categoryId}`);
      setPosts(response.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };

  // --- 4. Fetch Replies when a Post is Clicked ---
  const handlePostClick = async (postId) => {
    setSelectedPost(postId);
    try {
      const response = await api.get(`/forums/replies/${postId}`);
      setReplies(response.data);
    } catch (err) {
      console.error('Failed to fetch replies', err);
    }
  };

  // --- 5. Handle Submitting a New Reply ---
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/forums/replies', {
        body: replyBody,
        postId: selectedPost,
      });
      // Add new reply to the list instantly
      setReplies([...replies, response.data]);
      setReplyBody(''); // Clear the input box
    } catch (err) {
      console.error('Failed to post reply', err);
    }
  };
  
  // --- 6. Handle Collaborator Search ---
  const handleSearchCollaborators = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // We re-use the same /api/search/experts endpoint!
      const response = await api.post('/search/experts', { searchTerm: collabSearchTerm });
  
      // Filter out ourself from the results
      const otherResearchers = response.data.filter(r => r.user_id !== profile.user_id);
      setCollaborators(otherResearchers);
  
    } catch (err) {
      console.error('Collaborator search failed', err);
      setError('Search for collaborators failed.');
    }
  };

  if (!profile) return <div>Loading your profile...</div>;

  return (
    <div className="dashboard">
      {/* --- COLUMN 1: PROFILE & FORUM NAVIGATION --- */}
      <div className="search-column">
        <h2>Welcome, {profile.full_name}</h2>
        <p>Your specialties: <strong>{profile.specialties?.join(', ')}</strong></p>
        
        {/* --- NEW: Collaborator Search Form --- */}
        <div className="search-box" style={{ marginTop: '2rem' }}>
          <h3>Search Collaborators</h3>
          <form onSubmit={handleSearchCollaborators}>
            <input
              type="text"
              placeholder="e.g., Oncology"
              value={collabSearchTerm}
              onChange={(e) => setCollabSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>

        <hr style={{ margin: '2rem 0' }} />

        <h3>Forum Management</h3>
        <h4>Categories</h4>
        <div>
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => handleCategoryClick(cat.id)}
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
                style={{ cursor: 'pointer', background: selectedPost === post.id ? '#eef' : '#fff' }}
              >
                <strong>{post.title}</strong>
                <br />
                <small>Asked by: {post.full_name}</small>
              </div>
            ))
          ) : (
            <p>Select a category to see questions.</p>
          )}
        </div>
      </div>

      {/* --- COLUMN 2: COLLABORATORS, REPLIES & ANSWER BOX --- */}
      <div className="results-column">

        {/* --- NEW: Collaborator Results --- */}
        <h3>Collaborator Results</h3>
        {collaborators.length > 0 ? (
          collaborators.map((expert) => (
            <div key={expert.user_id} className="result-item">
              <h4>{expert.full_name}</h4>
              <p><strong>Specialties:</strong> {expert.specialties?.join(', ')}</p>
              <p><strong>Interests:</strong> {expert.research_interests?.join(', ')}</p>
            </div>
          ))
        ) : (
          <p>No collaborators found. Try a new search.</p>
        )}

        <hr style={{ margin: '2rem 0' }} />
        
        {/* --- Forum Section --- */}
        <h3>Question & Answers</h3>
        {!selectedPost && <p>Select a question to see the discussion.</p>}

        {/* Show all replies for the selected post */}
        {selectedPost && (
          <div>
            {replies.map((reply) => (
              <div key={reply.id} className="result-item" style={{ background: '#f9f9fT9' }}>
                <p>{reply.body}</p>
                <small>Answered by: {reply.full_name}</small>
              </div>
            ))}
            
            {/* Reply Form */}
            <form onSubmit={handleReplySubmit} style={{ marginTop: '1.5rem' }}>
              <h4>Your Answer</h4>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows="5"
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              />
              <button type="submit" style={{ marginTop: '0.5rem' }}>
                Post Reply
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResearcherDashboard;