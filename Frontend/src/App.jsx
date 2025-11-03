import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTheme } from './context/ThemeContext'; // 1. Import useTheme
import ThemeToggle from './components/ThemeToggle'; // 2. Import the toggle button
import './App.css';

function App() {
  const navigate = useNavigate();
  const { theme } = useTheme(); // 3. Get the current theme
  const token = localStorage.getItem('token');
  
  // Get user info to show the correct links
  let user = null;
  const userString = localStorage.getItem('user');
  if (userString) {
    user = JSON.parse(userString);
  }

  const handleLogout = () => {
    // Clear all session and local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear(); // Clear the dashboard state
    navigate('/login');
    window.location.reload(); // Force a refresh to clear state
  };

  return (
    // 4. Apply the theme class to the whole app
    <div className={`app-container ${theme}`}>
      <nav className="navbar">
        <div className="nav-links">
          <Link to="/">Home</Link>
          
          {/* Show links based on user role */}
          {user && user.role === 'PATIENT' && (
            <>
              <Link to="/dashboard/patient">My Dashboard</Link>
              <Link to="/favorites">My Favorites</Link>
            </>
          )}
          
          {user && user.role === 'RESEARCHER' && (
            <>
              <Link to="/dashboard/researcher">My Dashboard</Link>
              <Link to="/manage-trials">Manage Trials</Link>
              <Link to="/favorites">My Favorites</Link>
            </>
          )}
        </div>
        
        <div className="nav-actions">
          {token ? (
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
          {/* 5. Add the theme toggle button */}
          <ThemeToggle />
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;

