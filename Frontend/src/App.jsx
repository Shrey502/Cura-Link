// src/App.jsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // Get user info to show the correct links
  let user = null;
  const userString = localStorage.getItem('user');
  if (userString) {
    user = JSON.parse(userString);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload(); // Force a refresh to clear state
  };

  return (
    <div className="app-container">
      <nav style={{ padding: '1rem', background: '#eee', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
          
          {/* Show links based on user role */}
          {user && user.role === 'PATIENT' && (
            <>
              <Link to="/dashboard/patient" style={{ marginRight: '1rem' }}>My Dashboard</Link>
              <Link to="/favorites" style={{ marginRight: '1rem' }}>My Favorites</Link>
            </>
          )}
          
          {user && user.role === 'RESEARCHER' && (
            <>
              <Link to="/dashboard/researcher" style={{ marginRight: '1rem' }}>My Dashboard</Link>
              <Link to="/manage-trials" style={{ marginRight: '1rem' }}>Manage Trials</Link>
            </>
          )}
        </div>
        
        <div>
          {token ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
              <Link to="/register" style={{ marginRight: '1rem' }}>Register</Link>
            </>
          )}
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;