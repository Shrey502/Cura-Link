// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx' // We'll create this next
import './index.css'

// Import our new pages
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import ResearcherDashboard from './pages/ResearcherDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import ResearcherOnboarding from './pages/ResearcherOnboarding.jsx';
import ManageTrialsPage from './pages/ManageTrialsPage.jsx';
import PatientOnboarding from './pages/PatientOnboarding.jsx';

// Define our app's routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App.jsx will be our main layout
    // ... inside createBrowserRouter ...
children: [
  // Public routes
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Protected routes
  {
    element: <ProtectedRoute />, // This component protects all its children
    children: [
      { path: '/dashboard/patient', element: <PatientDashboard /> },
      { path: '/dashboard/researcher', element: <ResearcherDashboard /> },
      { path: '/favorites', element: <FavoritesPage /> },
      { path: '/onboarding/researcher', element: <ResearcherOnboarding /> },
      { path: '/manage-trials', element: <ManageTrialsPage /> },
      { path: '/onboarding/patient', element: <PatientOnboarding /> }
      // Add any other protected routes here
    ]
  }
]
// ...
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);