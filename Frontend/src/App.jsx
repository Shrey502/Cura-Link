import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation(); // 🧭 Get current route
  const { theme } = useTheme();
  const token = localStorage.getItem('token');
  
  // Get user info
  let user = null;
  const userString = localStorage.getItem('user');
  if (userString) {
    user = JSON.parse(userString);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/login');
    window.location.reload();
  };

  // 🧩 Define paths where the navbar should be hidden
  const hideNavbarRoutes = ['/chat'];

  // 🧠 Check if current path matches one of them
  const shouldHideNavbar = hideNavbarRoutes.some(path => location.pathname.startsWith(path));

  return (
    <div className={`app-container ${theme}`}>
      {/* 🧭 Hide navbar on specific pages */}
      {!shouldHideNavbar && (
        <nav className="navbar">
          <div className="nav-links">
            <Link to="/">Home</Link>

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
            <ThemeToggle />
          </div>
        </nav>
      )}

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
