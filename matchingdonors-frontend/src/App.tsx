import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthGate } from './components/auth/AuthGate';
import { AuthService } from './services/auth.service';
import { UserHeader } from './components/auth/UserHeader';
import { ProfileAgent } from './components/profile/ProfileAgent';
import { ProfileMatchingPage } from './components/profile/ProfileMatchingPage';
import { ProfileCompletionModal } from './components/profile/ProfileCompletionModal';
import { NewsHub } from './components/news/NewsHub';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { Toast } from './components/common/Toast';
import AdvertiserChatPage from './pages/AdvertiserChatPage';
import './App.css';

// Disclaimer for Demo only
const DisclaimerModal: React.FC<{ onAccept: () => void }> = ({ onAccept }) => {
  return (
    <div className="disclaimer-overlay">
      <div className="disclaimer-content">
        <h2 className="disclaimer-title">⚠️ Demo Application Disclaimer</h2>
        <p className="disclaimer-text">
          Welcome! Please note that this website is strictly a <strong>technical demonstration</strong> and is not affiliated with the live operations of MatchingDonors Inc.
          <br /><br />
          All user data, medical profiles, and matches within this application are randomly generated for testing purposes. Any actions or registrations taken here <strong>will not</strong> take effect on the official MatchingDonors platform.
        </p>
        <div className="disclaimer-actions">
          <button
            className="disclaimer-btn-secondary"
            onClick={() => window.location.href = 'https://www.matchingdonors.com/life'}
          >
            Go to Official Site
          </button>
          <button
            className="disclaimer-btn-primary"
            onClick={onAccept}
          >
            I Understand (Proceed to Demo)
          </button>
        </div>
      </div>
    </div>
  );
};

// Main content component (only shown when authenticated)
const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [profileCheckDone, setProfileCheckDone] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  // const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      if (user && !profileCheckDone) {
        // Skip the medical profile check completely for Sponsors! ---
        if (user.role === 'sponsor') {
          setProfileCheckDone(true);
          return;
        }

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
          // if (error?.response?.status !== 404) {
          console.log('Profile endpoint not found, showing modal for safety');
          setShowProfileModal(true);
          // }
        }
      }
    };

    checkProfile();
  }, [user, profileCheckDone]);

  const handleCompleteProfile = () => {
    setShowProfileModal(false);

    // Initialize empty profile for the user
    if (user) {
      setEditingProfile({
        name: user.firstName + ' ' + user.lastName,
        type: user.role,
        age: '',
        blood_type: '',
        organ_type: '',
        city: '',
        state: '',
        country: '',
        description: '',
        medical_info: '',
        preferences: '',
        is_public: true
      });
      setShowEditModal(true);
    }
  };

  const handleSaveProfile = async (updatedData: any) => {
    try {
      await AuthService.updateProfile(updatedData);
      setToast({ show: true, message: 'Profile saved successfully!', type: 'success' });
      setShowEditModal(false);
    } catch (error: any) {
      setToast({ show: true, message: 'Failed to save profile: ' + error.message, type: 'error' });
    }
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
          {user?.role === 'sponsor' && (
            <NavLink
              to="/advertiser-chat"
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              💬 Advertiser Chat
            </NavLink>
          )}
        </div>
        <UserHeader />
      </nav>

      <div className="app-content">
        <Routes>
          <Route path="/" element={<ProfileAgent />} />
          <Route path="/profile-fill" element={<ProfileAgent />} />
          <Route path="/profile-match" element={<ProfileMatchingPage />} />
          <Route path="/news-hub" element={<NewsHub />} />
          <Route path="/advertiser-chat"
            element={
              <AuthGate requiredRoles={['sponsor']}>
                <AdvertiserChatPage />
              </AuthGate>
            }
          />
        </Routes>
      </div>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={handleCloseModal}
        onComplete={handleCompleteProfile}
        userRole={user?.role || 'patient'}
      />

      {editingProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profileData={editingProfile}
          onSave={handleSaveProfile}
        />
      )}

      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  // Check localStorage to see if they've already accepted the disclaimer
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return localStorage.getItem('demoDisclaimerAccepted') !== 'true';
  });

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('demoDisclaimerAccepted', 'true');
    setShowDisclaimer(false);
  };

  return (
    <AuthProvider>
      <Router>
        {showDisclaimer && <DisclaimerModal onAccept={handleAcceptDisclaimer} />}

        <AuthGate>
          <AppContent />
        </AuthGate>
      </Router>
    </AuthProvider>
  );
};

export default App;
