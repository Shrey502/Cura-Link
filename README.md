CuraLink: Project Structure and File Breakdown

The CuraLink MVP is built on a clean, scalable Full-Stack Architecture, separating the API logic from the client-side rendering. This structure ensures high maintainability and performance.

1. Backend (bakcend)

This folder manages all API logic, data persistence, and security (Node.js/Express with PostgreSQL).

Directory Structure

bakcend/
├── db/
├── middleware/
├── routes/
│   ├── auth.js
│   ├── favorites.js
│   ├── forums.js
│   ├── profile.js
│   ├── search.js
│   └── trials.js
└── index.js


File Functionality

index.js
Function: The core server entry point.
Detail: Initializes the Express server, loads environment variables, registers global middleware (CORS, JSON parsing), and mounts all modular routes (e.g., /api/search) to their corresponding handler files.

db/db.js
Function: Database Connection Handler.
Detail: Creates and exports the reusable PostgreSQL connection pool (pg), simplifying database queries across the entire backend.

middleware/authenticateToken.js
Function: Security Middleware.
Detail: Executes on every protected route. It verifies the JWT from the request header and attaches the user's validated id and role to the request object.

routes/auth.js
Function: Authentication Logic.
Detail: Handles user creation (/register) using bcrypt for secure password hashing and login (/login) for JWT issuance.

routes/profile.js
Function: Profile Management.
Detail: Contains logic for fetching and updating user-specific data via GET and PUT methods for both patient and researcher profiles.

routes/search.js
Function: Discovery and External API Integration.
Detail: Centralizes all external calls to PubMed and ClinicalTrials.gov. It uses the Hugging Face API to perform AI summarization before returning results to the client.

routes/forums.js
Function: Community Logic.
Detail: Manages the entire forum Q&A system. It enforces role-based access, ensuring only researchers can reply and that posts/replies display the author's name by joining profile tables.

routes/trials.js
Function: Researcher Trial Management.
Detail: Handles the creation and viewing of clinical trials added specifically by the authenticated researcher, linking the trial records to their user_id.

2. Frontend (Frontend)

This folder contains the React application (Vite/Tailwind CSS) responsible for the user interface and interaction.

Directory Structure

Frontend/
├── src/
│   ├── api.js
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   └── pages/
│       └── ... (All JSX page files)
└── package.json


File Functionality

src/main.jsx
Function: React Router Setup.
Detail: Defines the application's URL paths, loads the main App layout, and implements the ProtectedRoute wrapper to secure dashboard access.

src/api.js
Function: API Helper / Security Layer.
Detail: Creates a custom Axios instance with a request interceptor that automatically retrieves the JWT from localStorage and attaches it to every single request, simplifying frontend security implementation.

src/components/ProtectedRoute.jsx
Function: Access Control.
Detail: A simple wrapper component that checks for the presence of a login token. If no token is found, the user is immediately redirected to the /login screen.

src/pages/PatientDashboard.jsx
Function: Patient Primary Workspace.
Detail: Contains search forms for publications/trials, displays AI-summarized results, and provides the patient's view of the community forum

src/pages/ResearcherDashboard.jsx
Function: Researcher Management Workspace.
Detail: Displays collaborator search results and serves as the main interface for Forum Management, allowing researchers to easily view patient questions and post official replies.