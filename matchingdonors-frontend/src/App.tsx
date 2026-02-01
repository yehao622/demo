import React from 'react';
import { ProfileAgent } from './components/profile/ProfileAgent';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGate } from './components/auth/AuthGate';
import { UserHeader } from './components/auth/UserHeader';
import { ProfileMatchingPage } from './components/profile/ProfileMatchingPage';
import { NewsHub } from './components/news/NewsHub';
import AdvertiserChatPage from './pages/AdvertiserChatPage';
import './App.css';

// Placeholder for Advertiser Chat (if it exists in your repo)
const AdvertiserChat: React.FC = () => {
  return (
    <div className="advertiser-placeholder">
      {/* <h1>💬 Advertiser Chat Agent</h1> */}
      <div><AdvertiserChatPage /></div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Navigation */}
          <header className='app-header'>
            <div className='header-content'>
              <div className="logo-section">
                <h1 className="app-logo">🏥 MatchingDonors AI Demo</h1>
                <p className="app-tagline">Powered by Gemini AI</p>
              </div>
              <nav className="main-nav">
                <NavLink
                  to="/profile-fill"
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                > 📝 Profile Fill
                </NavLink>
                <NavLink
                  to="/profile-match"
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                > 👥 Profile Match
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
              </nav>
            </div>
          </header>

          {/* Main contents: Routes */}
          <main className="app-main">
            <Routes>
              <Route path="/" element={
                <AuthGate>
                  <UserHeader />
                  <ProfileAgent />
                </AuthGate>
              } />
              <Route path="/profile-fill" element={
                <AuthGate>
                  <UserHeader />
                  <ProfileAgent />
                </AuthGate>
              } />
              <Route path="/profile-match" element={
                <AuthGate>
                  <UserHeader />
                  <ProfileMatchingPage />
                </AuthGate>
              } />
              <Route path="/news-hub" element={<NewsHub />} />
              <Route path="/advertiser-chat" element={<AdvertiserChat />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="app-footer">
            <p>
              MatchingDonors.com AI Agent Demo |
              <a href="https://github.com/yehao622/demo" target="_blank" rel="noopener noreferrer">
                GitHub Repository
              </a>
            </p>
          </footer>

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;