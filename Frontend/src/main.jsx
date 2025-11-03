import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext' // <-- 1. IMPORT
import App from './App.jsx'
import './index.css' // We will update this file next

// Import all pages
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import ResearcherDashboard from './pages/ResearcherDashboard.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import PatientOnboarding from './pages/PatientOnboarding.jsx'
import ResearcherOnboarding from './pages/ResearcherOnboarding.jsx'
import ManageTrialsPage from './pages/ManageTrialsPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
// Note: ContactModal is a component, so it's not imported here

// Define our app's routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App.jsx will be our main layout
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
          { path: '/onboarding/patient', element: <PatientOnboarding /> },
          { path: '/onboarding/researcher', element: <ResearcherOnboarding /> },
          { path: '/manage-trials', element: <ManageTrialsPage /> },
          { path: '/chat', element: <ChatPage /> }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. WRAP THE APP */}
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);

