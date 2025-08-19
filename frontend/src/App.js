import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Páginas
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import MapPage from './pages/MapPage';
import FiadosPage from './pages/FiadosPage';
import ReportesPage from './pages/ReportesPage';
import PricingPage from './pages/PricingPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" />;
}

function App() {
  const { currentUser } = useAuth();

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
<Router>
        <Routes>
          <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <div className="centered-page-container"><AuthPage /></div>} />
          
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/fiados" element={<ProtectedRoute><FiadosPage /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><ReportesPage /></ProtectedRoute>} />
          <Route path="/planes" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;