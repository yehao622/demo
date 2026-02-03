import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthGate } from './components/auth/AuthGate';
import { AuthService } from './services/auth.service';
import { UserHeader } from './components/auth/UserHeader';
import { ProfileAgent } from './components/profile/ProfileAgent';
import { ProfileMatchingPage } from './components/profile/ProfileMatchingPage';
import { ProfileCompletionModal } from './components/profile/ProfileCompletionModal';
import { NewsHub } from './components/news/NewsHub';
import AdvertiserChatPage from './pages/AdvertiserChatPage';
import './App.css';

// Main content component (only shown when authenticated)
const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileCheckDone, setProfileCheckDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      if (user && !profileCheckDone) {
        try {
          const { isComplete } = await AuthService.checkProfileCompletion();
          if (!isComplete) {
            setShowProfileModal(true);
          }
          setProfileCheckDone(true);
        } catch (error: any) {
          console.error('Failed to check profile:', error);
          // Don't block user if profile check fails, they can still use the app
          setProfileCheckDone(true);

          // Only show modal if it's not a 404 error
          if (error?.response?.status !== 404) {
            console.log('Profile endpoint not found, showing modal for safety');
            setShowProfileModal(true);
          }
        }
      }
    };

    checkProfile();
  }, [user, profileCheckDone]);

  const handleCompleteProfile = () => {
    setShowProfileModal(false);
    navigate('/profile-fill');
  };

  const handleCloseModal = () => {
    setShowProfileModal(false);
    setProfileCheckDone(true);
  };

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-brand">
          <h1>🏥 MatchingDonors AI Demo</h1>
          <p>Powered by Gemini AI</p>
        </div>
        <div className="nav-links">
          <NavLink
            to="/profile-fill"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            📝 Profile Fill
          </NavLink>
          <NavLink
            to="/profile-match"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            🔍 Profile Match
          </NavLink>
          <NavLink
            to="/news-hub"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            📰 News Hub
          </NavLink>
          <NavLink
            to="/advertiser-chat"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            💬 Advertiser Chat
          </NavLink>
        </div>
        <UserHeader />
      </nav>

      <div className="app-content">
        <Routes>
          <Route path="/" element={<ProfileAgent />} />
          <Route path="/profile-fill" element={<ProfileAgent />} />
          <Route path="/profile-match" element={<ProfileMatchingPage />} />
          <Route path="/news-hub" element={<NewsHub />} />
          <Route path="/advertiser-chat" element={<AdvertiserChatPage />} />
        </Routes>
      </div>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={handleCloseModal}
        onComplete={handleCompleteProfile}
        userRole={user?.role || 'patient'}
      />
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AuthGate>
          <AppContent />
        </AuthGate>
      </Router>
    </AuthProvider>
  );
};

export default App;
