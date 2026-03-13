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
    const [activeTab, setActiveTab] = useState('main');

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

            {/* Navigation Tabs */}
            <div className="landing-nav-tabs">
                <button className={`nav-tab ${activeTab === 'main' ? 'active' : ''}`} onClick={() => setActiveTab('main')}>🏠 Home</button>
                <button className={`nav-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>📖 About Us</button>
                <button className={`nav-tab ${activeTab === 'faqs' ? 'active' : ''}`} onClick={() => setActiveTab('faqs')}>❓ FAQs</button>
                <button className={`nav-tab ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>💳 Registry Fees</button>
                <button className={`nav-tab ${activeTab === 'psa' ? 'active' : ''}`} onClick={() => setActiveTab('psa')}>📢 Media & PSAs</button>
                <button className={`nav-tab ${activeTab === 'terms' ? 'active' : ''}`} onClick={() => setActiveTab('terms')}>⚖️ Terms & Privacy</button>
            </div>

            {/* Main Content */}
            {activeTab === 'main' && (
                <>
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
                            <div className="organ-card">Kidney</div>
                            <div className="organ-card">Pancreas</div>
                            <div className="organ-card">Liver</div>
                            <div className="organ-card">Lung</div>
                            <div className="organ-card">Pancreas</div>
                            <div className="organ-card">Bone Marrow</div>
                            <div className="organ-card">Intestine</div>
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
                </>
            )}

            {/* About Us Section */}
            {activeTab === 'about' && (
                <div className="page-content-box">
                    <h2>About MatchingDonors.com</h2>
                    <p>Founded in 2004, MatchingDonors is a 501(c)3 nonprofit organization supported by memberships, advertisements and donations.</p>

                    <h3>Mission Statement</h3>
                    <p>MatchingDonors.com is a web site created to give people in need of transplant surgery an active way to search for a live organ donor. Our goal is to increase the number of transplant surgeries and improve awareness of live organ donation. The most common organs transplanted from a live donor are single kidney and liver lobes.</p>

                    <h3>How It Started</h3>
                    <p>MatchingDonors.com was co-founded in 2004 by Mr. Paul Dooley and Dr. Jeremiah Lowney. Mr. Dooley from Canton, MA met with his Internist, Dr. Lowney from Boston, MA. and related a story about his father who was told that although he was very ill from cancer and was told he would be in need of a new kidney soon he would not be placed on the national transplantation waiting list. The reason was because the list was so long that by the time a kidney would become available Mr. Dooley's father would not still be alive. Obviously this was troubling.</p>
                    <p>Mr. Dooley also the founder an award winning Internet jobboard called CollegeJobBoard.com. He asked Dr. Lowney if a web site matching potential live organ donors to people in need of organ transplant would help the problem of organ shortage. Both men decided to research the issue and found a National Kidney Foundation survey of 1,000 people, which were asked if they would consider live organ donation to a complete stranger. To their surprise, 25% said they would consider the donation. The co-founders then got to work to create the web site.</p>

                    <h3>The Problem</h3>
                    <p>In 1993 there were 31,000 people on the national organ transplant waiting list. In 2005 there are 90,000 people. There are approximately 17 people a day dying while waiting on the list. Although live organ donation has been performed successfully since 1954 there are only six to seven thousand live organ donations per year. Most of the transplanted organs at this time are from cadavers, which become available at a minutes notice to the potential recipient.</p>
                    <p>The newly harvested organ is distributed through United Network for Organ Sharing (UNOS) who maintains the national waiting list under contract from the federal government. UNOS also attempts to increase organ donation awareness. Unfortunately, organ donation has been stagnant over the years and there is a severe shortage of available cadaver organs.</p>

                    <h3>One Answer</h3>
                    <p>With our growing list of potential live organ donors signing on to MatchingDonors.com it is becoming increasingly clear that there are thousands of wonderful, altruistic and compassionate people willing to help a fellow human being. It is our belief that many of the potential donors would have never considered live organ donation if it wasn't for the increased awareness due to our site. MatchingDonors.com augments the current failing system by allowing people in need of organ transplantation the ability to search for potential altruistic live organ donors over the World Wide Web.</p>
                    <p>A potential recipient places his or her profile on the web site and can then review email of potential donors interested in helping. The profile can consist of any information the patient feels comfortable sharing with viewers. Typically the profile states the patient's personal history, current situation, blood type and whether they can travel. It is up to the patient to provide their profile and the staff at MatchingDonors.com can assist them if they wish. Once a patient is contacted they may ask the potential donor to contact the transplant hospital coordinated in charge of the patients care. A test kit can then be provided to the potential donor for blood sampling at their local lab. This begins the process of finding a match.</p>
                    <p>The patient's insurance provider pays for all the pre-operative testing. MatchingDonors.com can also send press releases to organizations and newsletters, which patients may request. MatchingDonors.com suggests a patient fee to place their profile on the web site. The fee is waived if the patients are unable to afford the cost.</p>

                    <h3>The Match Process</h3>
                    <p>Once a match is made the rules and regulations required for a live organ donation apply. MatchingDonors.com is interested in helping develop the match. The transplant protocol is the same for a match made through our web site as it is for any other live organ match. The organ donor is made aware through multiple postings on MatchingDonors.com that financial benefit for their donation is illegal in the United States.</p>
                    <p>Although it is not required, MatchingDonors.com request that patients provide statistical data to us for record keeping. This data includes the number of email inquiries, potential matches, patient's tested, successful matches and surgeries performed. They may also provide any personal notes they wish to add.</p>

                    <hr style={{ margin: '2.5rem 0', borderColor: 'var(--bg-hover)', borderTop: '2px solid' }} />

                    <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Based in Canton, Massachusetts., MatchingDonors.com is a company with technical, matching facilitators, editorial and administrative people based throughout the United States.</p>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>MatchingDonors.com Medical Director Dr. Jeremiah Lowney is available for interviews from the press and to answer questions from patients, donors and doctors.</p>
                </div>
            )}

            {/* FAQs Section */}
            {activeTab === 'faqs' && (
                <div className="page-content-box">
                    <h2>Frequently Asked Questions</h2>

                    <h3>General & Membership</h3>
                    <div className="faq-list">
                        <div className="faq-item">
                            <h4>Q: Does MatchingDonors.com offer free or discounted memberships?</h4>
                            <p>A: Yes we do, there are different criteria for free or discounted memberships. Please call us at 781-821-2204 to see if you qualify for a free membership.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: If I have not purchased a membership yet, am I still able to contact donors?</h4>
                            <p>A: Your information can only be viewed by Potential Donors if you have an active membership.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Can a patient finance their membership?</h4>
                            <p>A: Yes, a patient can apply for financing of a $595 lifetime membership. You will need to call MatchingDonors.com at 781-821-2204 Ext. 5 or 800-385-0422 ext. 5.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Can I pay or request to be paid for an organ?</h4>
                            <p>A: <strong>NO.</strong> It is absolutely against the law to have any financial benefit from organ donation. Violators can be subject to $50,000 fines and/or five years of imprisonment. Our terms allow us to give your information to the FBI without permission if you violate this prohibition.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Does MatchingDonors.com guarantee free airfare?</h4>
                            <p>A: No. Free airfare may be arranged for travel within the United States for testing and surgery, but there are blackout periods and restrictions. Contact us as soon as possible to see how we can help.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Can I work with donors outside the United States?</h4>
                            <p>A: Patients can only deal with donors in the United States or Canada. If you deal with donors outside these countries in any way you will be permanently removed from MatchingDonors.com.</p>
                        </div>
                    </div>

                    <h3>Privacy & Profile Management</h3>
                    <div className="faq-list" style={{ marginTop: '1.5rem' }}>
                        <div className="faq-item">
                            <h4>Q: Can donors see the patient's profiles or contact info?</h4>
                            <p>A: Donors can only see active patient profiles that are not private. Donors can <strong>never</strong> see your Last Name, street address, or email address.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Can a patient or donor remove their profile?</h4>
                            <p>A: Yes, they can remove their profile at any time. When this happens, all messages that were sent will be removed from the In-Box of the person they were sent to.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Why did I get an email about a message, but it was not in my In-Box?</h4>
                            <p>A: Either the patient or donor retracted the message or removed their profile. MatchingDonors cannot retrieve this message or give you their contact information once removed.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Can I edit my profile after I upload it?</h4>
                            <p>A: Yes, you have the ability to manage, edit, and update your profile at any time. MatchingDonors.com also reserves the right to remove or suspend any profile at any time.</p>
                        </div>
                    </div>

                    <h3>Search Agents & Communication</h3>
                    <div className="faq-list" style={{ marginTop: '1.5rem' }}>
                        <div className="faq-item">
                            <h4>Q: What is a "Search Agent"?</h4>
                            <p>A: Our search agent will automatically search for new profiles, or profiles that have been updated continuously during the day, which meet your keyword criteria. The organ you are requesting/donating is automatically put in as a search agent when you sign up. You can make up to 10 additional search agents.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Can a patient search for donors?</h4>
                            <p>A: Patients can only search donors through their search agents. Patients can only contact donors that contact them, or donors that appear in their search agents.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: I sent messages to potential donors but they haven't opened them. Why?</h4>
                            <p>A: Donors usually view the profile sent to them, and if they do not think they want to donate to that patient, they will not respond. Also, if a donor is already talking to a patient they like, they may not respond to other messages. To avoid this, contact new donors every day.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Can donors contact and be tested for more than one patient at a time?</h4>
                            <p>A: Yes, donors can be testing for more than one patient at a time.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Why do I see the same potential donors some weeks in my search agents?</h4>
                            <p>A: If a donor updates their profile, the system will see them as a new or updated profile and will send them out in the search agent again.</p>
                        </div>
                    </div>

                    <h3>Medical & Transplant Centers</h3>
                    <div className="faq-list" style={{ marginTop: '1.5rem' }}>
                        <div className="faq-item">
                            <h4>Q: Who is compatible with my blood type?</h4>
                            <p style={{ marginBottom: '10px' }}>A: Kidney donors must have a compatible blood type with the recipient. In living donation, the following blood types are compatible:</p>
                            <ul style={{ color: 'var(--text-muted)', marginLeft: '20px', marginBottom: '10px' }}>
                                <li><strong>Type O</strong> (Universal Donor): Can donate to A, B, AB, and O. Can only receive from O.</li>
                                <li><strong>Type A:</strong> Can donate to A and AB. Can receive from A and O.</li>
                                <li><strong>Type B:</strong> Can donate to B and AB. Can receive from B and O.</li>
                                <li><strong>Type AB</strong> (Universal Recipient): Can donate to AB only. Can receive from A, B, AB, and O.</li>
                            </ul>
                        </div>
                        <div className="faq-item">
                            <h4>Q: Can MatchingDonors.com help me find a transplant center?</h4>
                            <p>A: Yes, we can. There are many great transplant centers out there that we can refer to you. If you are already at one, you do not need to change it.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Q: What if my transplant center does not take living altruistic donors from MatchingDonors?</h4>
                            <p>A: It is your responsibility to find out before you register to see if your transplant center will take donors of any kind. Many hospitals do; it may be worth your while to find another hospital if yours does not accept us.</p>
                        </div>
                    </div>

                    <hr style={{ margin: '3rem 0', borderColor: 'var(--bg-hover)', borderTop: '2px solid' }} />

                    <h2>CEO Email Blast Requirements</h2>
                    <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                        If after being registered as a patient for three months you do not have donors being tested for you, we can send a personal email blast from the CEO of MatchingDonors.com to all compatible donors.
                    </p>
                    <p style={{ marginBottom: '2rem', color: 'var(--error)', fontWeight: 'bold' }}>
                        To qualify, you must "use" the site at least 5 days a week for three consecutive months by completing ALL the steps below. If you miss a day, the clock starts again. There are no exceptions.
                    </p>

                    <div className="faq-list">
                        <div className="faq-item" style={{ borderLeftColor: 'var(--secondary)' }}>
                            <h4>1. Maintain Your Account</h4>
                            <p>Sign into your MatchingDonors.com account and update your profile.</p>
                        </div>
                        <div className="faq-item" style={{ borderLeftColor: 'var(--secondary)' }}>
                            <h4>2. Contact Compatible Donors</h4>
                            <p>Contact every new and updated donor in your search agent that has a compatible blood type to you. Send each of these donors a personalized private message through the platform.</p>
                        </div>
                        <div className="faq-item" style={{ borderLeftColor: 'var(--secondary)' }}>
                            <h4>3. Keep Detailed Records</h4>
                            <p>Save each donor that you contact and keep detailed notes on every donor in the “saved donor section”. Please remember you must take notes in the notes section for every donor you save, including all interactions. These will be reviewed by the MatchingDonors.com team.</p>
                        </div>
                        <div className="faq-item" style={{ borderLeftColor: 'var(--secondary)' }}>
                            <h4>4. Follow Up By Phone</h4>
                            <p>If the donor has a telephone number, call the donor asking them if they will be tested for you. If you get a voicemail, leave a message and then call back three times a week until the donor talks to you. If there is no voicemail, call back three times a week until the donor talks to you.</p>
                        </div>
                        <div className="faq-item" style={{ borderLeftColor: 'var(--secondary)' }}>
                            <h4>5. Report Invalid Numbers</h4>
                            <p>If the donor’s telephone number does not work for any reason, you must send us a notification through the “Press Here To Report This Donor's Profile Because of Abuse” link in the donor’s profile. Put in your email address and reason for your complaint, and send it to us.</p>
                        </div>
                    </div>
                </div>
            )}

            {/*Registry Fees Section */}
            {activeTab === 'fees' && (
                <div className="page-content-box">
                    <h2>Patient Membership & Organ Registry Fees</h2>
                    <p>Before you can create your Patient Profile and contact our 15,700+ registered donors, you must choose one of the membership plans below. You may be able to deduct your membership (organ registry fee) on your taxes.</p>

                    <div className="pricing-grid">
                        <div className="pricing-card">
                            <h3>7 Day Trial</h3>
                            <div className="price">$49</div>
                            <div className="duration">For 7 Days</div>
                            <p>You can only purchase a trial membership as your first membership. Includes posting of your profile and all benefits.</p>
                        </div>
                        <div className="pricing-card">
                            <h3>30 Day Plan</h3>
                            <div className="price">$295</div>
                            <div className="duration">Per Month</div>
                            <p>Standard monthly membership. Includes posting of your profile on MatchingDonors.com, and all included benefits.</p>
                        </div>
                        <div className="pricing-card" style={{ borderColor: 'var(--primary)', borderWidth: '2px' }}>
                            <h3>3 Month Plan</h3>
                            <div className="price">$441</div>
                            <div className="duration">For 90 Days</div>
                            <p><strong>Most Popular!</strong> This package comes out to be only $147 per month.</p>
                        </div>
                        <div className="pricing-card">
                            <h3>Lifetime</h3>
                            <div className="price">$595</div>
                            <div className="duration">One Time Fee</div>
                            <p>Covers the life of the website (not the subscriber). Non-transferable. We also offer financing options for this tier.</p>
                        </div>
                    </div>

                    <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <em>Note: If you cannot afford a patient membership, please contact us at 781-821-2204 to discuss your options. There is no charge for any patients from the United Kingdom.</em>
                    </p>
                </div>
            )}

            {/* Media & PSAs Section */}
            {activeTab === 'psa' && (
                <div className="page-content-box" style={{ textAlign: 'center' }}>
                    <h2>Public Service Announcements</h2>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Help us spread the word and save lives. Feel free to use any of our professionally created Public Service Announcements (PSAs) for radio, television, print, and the web.</p>

                    <a href="https://www.dropbox.com/sh/805vanvjrz9ddde/AAAq_s04jooIYionYjMd84XQa?dl=0" target="_blank" rel="noopener noreferrer" className="btn-alt-donate" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                        📥 Download Media Kit from Dropbox
                    </a>

                    <p style={{ marginTop: '2rem' }}>Call us at 781-821-2204 if you need them resized or customized to your specifications.</p>
                </div>
            )}

            {/* Terms & Privacy Section */}
            {activeTab === 'terms' && (
                <div className="page-content-box">
                    <h2>Terms & Conditions and Privacy Policy</h2>
                    <p><strong>PLEASE READ THESE TERMS AND CONDITIONS OF USE, AND PRIVACY POLICY CAREFULLY BEFORE USING THIS SITE.</strong></p>
                    <p>By accessing, browsing, or using this Web site, you acknowledge that you have read, understood, and agree to be bound by these terms and to comply with all applicable laws and regulations. If you do not agree to these terms, please do not use this Web site.</p>

                    <h3>Nondiscrimination Policy</h3>
                    <p>MatchingDonors does not and shall not discriminate on the basis of race, color, religion (creed), gender, gender expression, age, national origin (ancestry), disability, marital status, sexual orientation, or military status, in any of its activities or operations. We are committed to providing an inclusive and welcoming environment for all members of our staff, clients, volunteers, subcontractors, and vendors.</p>

                    <h3>Eligibility and Communications</h3>
                    <p>Donors that register on MatchingDonors.com can only be from and be citizens of the United States, or Canada. Donors must also be currently living in either the United States or Canada. All others will be removed. If you pay as a Patient and you are from outside the United States or Canada, your paid membership will be deleted, and your payment will not be refunded.</p>
                    <div className="faq-item" style={{ borderLeftColor: 'var(--warning)', marginTop: '1rem', marginBottom: '1rem' }}>
                        <p><strong>Communication Warning:</strong> Both Donors and Patients may not contact each other directly by text, cell phone, or personal email initially, or they will be permanently removed from the website.</p>
                    </div>

                    <h3>Important Legal & Compliance Notices</h3>
                    <div className="faq-item" style={{ borderLeftColor: 'var(--error)', marginTop: '1rem', marginBottom: '1rem', backgroundColor: '#fff5f5' }}>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-main)' }}>
                            <li style={{ marginBottom: '10px' }}><strong>HIPAA Violations:</strong> Patient representatives on MatchingDonors.com can only be a direct family member. Sharing donor or patient info without written consent is a violation of HIPAA Laws. Penalties can attract a fine of up to <strong>$250,000 with a maximum jail term of 10 years.</strong></li>
                            <li><strong>National Organ Transplant Act (NOTA):</strong> Section 301 prohibits any person from knowingly acquiring, receiving, or transferring any human organ for valuable consideration. Violators can be subject to <strong>$50,000 fines and/or five years of imprisonment.</strong></li>
                        </ul>
                    </div>

                    <h3>No Medical Advice</h3>
                    <p><strong>THE SITE DOES NOT PROVIDE MEDICAL ADVICE.</strong> The contents of the MatchingDonors Site are for informational purposes only and are not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician. If you think you may have a medical emergency, call your doctor or 911 immediately.</p>

                    <h3>Memberships and Billing</h3>
                    <p><strong>Lifetime Membership:</strong> A lifetime membership covers the life of the MatchingDonors.com website, or the point at which the patient receives a transplant (whichever comes first). It is not transferable to any other person.</p>
                    <p><strong>Refunds:</strong> If you cancel your MatchingDonors.com account within three business days from the date of purchase, we will provide a full refund. If you cancel thereafter, you will not be entitled to any refund. All refund requests must be sent by certified mail.</p>

                    <h3>Code of Conduct & Severe Penalties</h3>
                    <p>In consideration of being allowed to use any part of MatchingDonors.com, you agree that the following actions constitute a material breach. This will permanently remove you from the website, and you agree to pay a fee of <strong>$250,000 US Dollars to MatchingDonors.com for each infraction:</strong></p>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)' }}>
                        <li>Using a Public Area for any purpose in violation of local, state, national, or international laws.</li>
                        <li>Offering to pay or paying a donor for anything other than testing and travel.</li>
                        <li>Impersonating another person or providing false contact information.</li>
                        <li>Soliciting donors or patients to have a transplant outside of the United States and/or Canada.</li>
                        <li>Soliciting, aiding, or using any donors or patients to use services outside of MatchingDonors.com (including transplant chains/tourism).</li>
                    </ul>

                    <hr style={{ margin: '3rem 0', borderColor: 'var(--bg-hover)', borderTop: '2px solid' }} />

                    <h2>Privacy Policy</h2>
                    <p>Your privacy is important to MatchingDonors, Inc. We understand that health is a very personal, private subject. We comply with the standards set by Health on the Net [HON].</p>

                    <h3>Information Collected</h3>
                    <p><strong>Personally Identifiable Information (PII):</strong> Information that can be used to identify or contact you. We collect this when you register as a Member, update your profile, or use Interactive Tools.</p>
                    <p><strong>Cookies & Web Beacons:</strong> We collect anonymous, non-personal information about your use of our site to help dynamically generate advertising and content. Cookies are small computer files transferred to your hard drive. <strong>We do not store your PII in your permanent cookies.</strong></p>

                    <h3>Disclosure of Your Information</h3>
                    <p>MatchingDonors will not disclose any Personal Information gathered if you choose the private option. If you do not choose the "Private" option, we may release potential donors' contact information to Patient Members. We may also release information to comply with valid legal requirements, such as a subpoena or court order.</p>

                    <h3>Security & Encryption</h3>
                    <p>MatchingDonors uses Secure Socket Layer (SSL) 128-bit encryption technology in transmitting your Personal Information to our servers. On the employee side, only a limited number of MatchingDonors employees are authorized to access your Personal Information. Violators are subject to termination.</p>

                    <div className="faq-item" style={{ marginTop: '2.5rem', backgroundColor: 'var(--bg-hover)', borderLeftColor: 'var(--info)' }}>
                        <h4>Contact Information</h4>
                        <p style={{ margin: 0 }}>
                            <strong>MatchingDonors.com, Inc. (A Non-Profit Organization)</strong><br />
                            766 Turnpike Street<br />
                            Canton, MA 02021<br />
                            Office: 781-821-2204<br />
                            E-mail: contactus@matchingdonors.com
                        </p>
                    </div>
                </div>
            )}

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

            <footer className="landing-footer">
                <p>
                    Please direct questions, suggestions or concerns to the <a href="mailto:contactus@matchingdonors.com">WebMaster</a>.
                </p>
                <p>
                    MatchingDonors is a 501(c)3 nonprofit organization supported by memberships, advertisements and donations.
                </p>
                <p>
                    Copyright &copy; 2003- 2026 - MatchingDonors.com
                </p>
            </footer>
        </div>
    );
};