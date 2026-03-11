import React, { useEffect, useState } from 'react';
import { UserRole } from '../../types/auth.types';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import '../../styles/AuthGate.css';

interface AuthGateProps {
    children: React.ReactNode;
    requiredRoles?: UserRole[];
}

export const AuthGate: React.FC<AuthGateProps> = ({ children, requiredRoles = ['patient', 'donor', 'sponsor'] }) => {
    const { isAuthenticated, user, isLoading, pendingRegistration, clearPendingRegistration } = useAuth();
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [weather, setWeather] = useState<{ temp: number; code: string } | null>(null);

    useEffect(() => {
        // Update the clock every minute
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        // Fetch local weather (using Open-Meteo free API)
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`);
                const data = await res.json();
                setWeather({ temp: Math.round(data.current_weather.temperature), code: '°F' });
            } catch (err) {
                console.error("Failed to fetch weather", err);
            }
        };

        // Try to get user's location, default to Boston (42.36, -71.06) if blocked
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => fetchWeather(42.3601, -71.0589)
            );
        } else {
            fetchWeather(42.3601, -71.0589);
        }

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (pendingRegistration && !isAuthenticated) {
            setSelectedRole(pendingRegistration.role);
            setShowRegister(true);
            clearPendingRegistration();
        }
    }, [pendingRegistration, isAuthenticated, clearPendingRegistration]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="auth-gate-loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Check if user is authenticated and has required role
    if (isAuthenticated && user) {
        if (user.is_admin) {
            return <>{children}</>;
        }

        if (requiredRoles.includes(user.role)) {
            return <>{children}</>;
        } else {
            // Bounce them to their proper home page instead of trapping them!
            if (user.role === 'sponsor') {
                return <Navigate to="/news-hub" replace />;
            } else {
                return <Navigate to="/profile-fill" replace />;
            }
        }
    }

    // Show role selection if no role selected
    return (
        <div className="landing-container">
            <div className="landing-top-bar">
                <div className="landing-brand">
                    <h2>MatchingDonors.com</h2>
                    <p>Saving Lives Since 2004</p>
                </div>

                <div className="landing-weather">
                    <div className="weather-time">
                        🕒 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {weather ? ` | 🌡️ ${weather.temp}${weather.code}` : ''}
                    </div>
                    <div className="weather-date">
                        📅 {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                <div className="landing-actions">
                    <button className="btn-login patient" onClick={() => { setSelectedRole('patient'); setShowLogin(true); }}>
                        👤 Patient Login
                    </button>
                    <button className="btn-login donor" onClick={() => { setSelectedRole('donor'); setShowLogin(true); }}>
                        💝 Donor Login
                    </button>
                    <button className="btn-login sponsor" onClick={() => { setSelectedRole('sponsor'); setShowLogin(true); }}>
                        🤝 Sponsor Login
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <section className="hero-section">
                <h1>The Ultimate Gift Found Online</h1>
                <p>Since launching in 2004, our award-winning 501(c)(3) nonprofit organization has helped over 10,000 registered patients needing organ transplants find living altruistic organ donors.</p>
                <div className="hero-stats">
                    <div className="stat-box">
                        <h3>15,781</h3>
                        <p>Registered Donors</p>
                    </div>
                    <div className="stat-box">
                        <h3>10,000+</h3>
                        <p>Patients Helped</p>
                    </div>
                    <div className="stat-box">
                        <h3>93 Days</h3>
                        <p>Record Transplant Time</p>
                    </div>
                </div>
            </section>

            {/* Organs Section */}
            <section className="content-section">
                <h2 className="section-title">Organs That Can Be Transplanted</h2>
                <div className="organs-grid">
                    <div className="organ-card">🩺 Kidney</div>
                    <div className="organ-card">🩺 Kidney & Pancreas</div>
                    <div className="organ-card">🩺 Liver</div>
                    <div className="organ-card">🩺 Liver & Lung</div>
                    <div className="organ-card">🩺 Lung</div>
                    <div className="organ-card">🩺 Pancreas</div>
                    <div className="organ-card">🩺 Bone Marrow</div>
                    <div className="organ-card">🩺 Intestine</div>
                </div>
                <p className="organs-disclaimer">
                    * All organ donations on this site are only from living donors. MatchingDonors is a 501(c)(3) nonprofit organization supported by patient memberships, advertisements, and donations.
                </p>
            </section>

            {/* Donation Banner */}
            <section className="alt-donation-banner">
                <h2>Other Ways to Save a Life</h2>
                <p>
                    You don't need to donate a kidney to save a life. Did you know that you could also help to save the lives of people needing transplants by Donating Real Estate, Cars, Boats, TimeShares, Collectibles, and other things to MatchingDonors? By doing this you can also get great tax benefits.
                </p>
                <a href="https://www.matchingdonorsdonations.com/" target="_blank" rel="noopener noreferrer" className="btn-alt-donate">
                    Press here to see more information
                </a>
            </section>

            {/* Videos Section */}
            <section className="content-section">
                <h2 className="section-title">Featured on National Television</h2>
                <div className="video-grid">
                    <div className="video-card">
                        <iframe src="https://www.youtube.com/embed/s1Ky3rw3CRA" frameBorder="0" allowFullScreen title="NBC Today Show"></iframe>
                        <h3>NBC's TODAY Show</h3>
                    </div>
                    <div className="video-card">
                        <iframe src="https://www.youtube.com/embed/XJKEGWluVNI" frameBorder="0" allowFullScreen title="Fox News"></iframe>
                        <h3>Fox News Coverage</h3>
                    </div>
                    <div className="video-card">
                        <iframe src="https://www.youtube.com/embed/wtQbCEz8nlI" frameBorder="0" allowFullScreen title="Movie Trailer"></iframe>
                        <h3>MatchingDonors Movie Trailer</h3>
                    </div>
                </div>
            </section>

            {/* News Section */}
            <section className="content-section">
                <h2 className="section-title">What The Press is Saying</h2>
                <div className="news-grid">
                    <div className="news-card">
                        <h3>📰 The Washington Post</h3>
                        <p>"I don't think we can legislate or regulate how people get to know each other... Once that occurs and someone decides they want to save another person, I don't think we ought to stop that as long as they are medically suitable..."</p>
                    </div>
                    <div className="news-card">
                        <h3>📰 The New York Times</h3>
                        <p>"I turned to MatchingDonors.com, a Web site created last year to help link potential donors and recipients. Once a match is made, the process follows the standard path..." - Dr. Sally Satel</p>
                    </div>
                    <div className="news-card">
                        <h3>📰 Chicago Sun Times</h3>
                        <p>In an extraordinary sacrifice, a man donates a kidney to a woman, then his wife serves as surrogate mother for her twins. They found each other on MatchingDonors.com.</p>
                    </div>
                </div>
            </section>

            {/* Modals remain exactly the same */}
            {showLogin && selectedRole && (
                <LoginModal
                    role={selectedRole}
                    onClose={() => {
                        setShowLogin(false);
                        setSelectedRole(null);
                    }}
                    onSwitchToRegister={() => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                />
            )}

            {showRegister && selectedRole && (
                <RegisterModal
                    role={selectedRole}
                    onClose={() => {
                        setShowRegister(false);
                        setSelectedRole(null);
                    }}
                    onSwitchToLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                />
            )}
        </div>
    );
};