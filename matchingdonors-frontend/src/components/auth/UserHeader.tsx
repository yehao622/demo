import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ViewProfileModal } from '../profile/ViewProfileModal';
import { EditProfileModal } from '../profile/EditProfileModal';
import { SponsorProfileModal } from '../profile/SponsorProfileModal';
import { SponsorProfileService, SponsorProfileData } from '../../services/sponsorProfile.service';
import { ViewSponsorProfileModal } from '../profile/ViewSponsorProfileModal';
import { FavoritesModal } from '../profile/FavoritesModal';
import { Toast } from '../common/Toast';
import { AuthService } from '../../services/auth.service';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { io } from 'socket.io-client';
import '../../styles/UserHeader.css';

export const UserHeader: React.FC = () => {
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSponsorModal, setShowSponsorModal] = useState(false);
    const [showSponsorViewModal, setShowSponsorViewModal] = useState(false);
    const [sponsorData, setSponsorData] = useState<SponsorProfileData | null>(null);
    const [showFavoritesModal, setShowFavoritesModal] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({
        show: false,
        message: '',
        type: 'success'
    });

    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    // Fetch notifications on mount
    useEffect(() => {
        if (!user) return;

        // 1. Load initial inbox from database
        loadNotifications();

        // 2. Connect to the WebSocket server
        const socket = io('http://localhost:8080');

        socket.on('connect', () => {
            console.log('Connected to real-time notifications!');
            // Tell the server who we are so we only get our own messages
            socket.emit('join', user.id);
        });

        // 3. Listen for incoming live notifications
        socket.on('new_notification', (newNotif: AppNotification) => {
            console.log('🔔 Live Notification Received:', newNotif);

            // Add the new notification to the TOP of the inbox list
            setNotifications(prev => [newNotif, ...prev]);

            // Optional: Pop a visual toast alert!
            setToast({
                show: true,
                message: `New message: ${newNotif.title}`,
                type: 'info'
            });
        });

        // Cleanup function: disconnect when the component unmounts
        return () => {
            socket.disconnect();
        };
    }, [user]);

    if (!user) return null;

    const loadNotifications = async () => {
        try {
            const data = await NotificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            await NotificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const handleClearInbox = async () => {
        try {
            await NotificationService.clearAll();
            setNotifications([]);
        } catch (error) {
            console.error("Failed to clear inbox", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleViewProfile = () => {
        setShowProfileMenu(false);
        if (user.role === 'sponsor') {
            setShowSponsorViewModal(true);
        } else {
            setShowViewModal(true);
        }
    };

    const handleEditProfile = async () => {
        // console.log('Edit Profile clicked'); // Debug log
        setShowProfileMenu(false);

        if (user.role === 'sponsor') {
            // --- SPONSOR FLOW ---
            try {
                const response = await SponsorProfileService.getProfile();
                setSponsorData(response.profile || null);
                setShowSponsorModal(true);
            } catch (error: any) {
                // If sponsor profile missing, just open empty modal
                setSponsorData(null);
                setShowSponsorModal(true);
            }
        } else {
            try {
                // Load profile data before opening edit modal
                const response = await AuthService.getProfile();

                if (response.success && response.profile) {
                    setProfileData(response.profile);
                    setShowEditModal(true);
                }
            } catch (error: any) {
                // We initialize an empty profile object and open the modal anyway.
                const isNotFoundError =
                    (error.response && error.response.status === 404) ||
                    (error.message && error.message.toLowerCase().includes('not found'));

                if (isNotFoundError) {
                    console.log("No profile found, initializing empty form.");
                    setProfileData({
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
                } else {
                    // Actual system errors (server down, 500, etc)
                    console.error('Failed to load profile:', error);
                    setToast({
                        show: true,
                        message: 'Failed to load profile: ' + (error.message || 'Unknown error'),
                        type: 'error'
                    });
                }
            }
        }
    };

    const handleLogout = () => {
        console.log('Logout clicked'); // Debug log
        setShowProfileMenu(false);
        logout();
    };

    const handleSaveProfile = async (updatedData: any) => {
        try {
            await AuthService.updateProfile(updatedData);
            setToast({
                show: true,
                message: 'Profile saved successfully!',
                type: 'success'
            });
            setShowEditModal(false);
        } catch (error: any) {
            setToast({
                show: true,
                message: 'Failed to save profile: ' + error.message,
                type: 'error'
            });
        }
    };

    const handleSaveSponsorProfile = async (updatedData: SponsorProfileData) => {
        try {
            await SponsorProfileService.saveProfile(updatedData);
            setToast({ show: true, message: 'Sponsor profile saved successfully!', type: 'success' });
            setShowSponsorModal(false);
        } catch (error: any) {
            setToast({ show: true, message: 'Failed to save sponsor profile.', type: 'error' });
        }
    };

    const closeToast = () => {
        setToast({ ...toast, show: false });
    };

    // Helper to format the role nicely
    const displayRole = user.role === 'patient' ? 'Patient' : user.role === 'donor' ? 'Donor' : 'Sponsor';

    return (
        <>
            <div className="user-header">
                {/* --- NEW: Notification Bell --- */}
                <div className="notification-wrapper">
                    <button
                        className="bell-button"
                        onClick={() => {
                            setShowInbox(!showInbox);
                            setShowProfileMenu(false);
                        }}
                    >
                        🔔
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>

                    {/* Inbox Dropdown */}
                    {showInbox && (
                        <>
                            <div className="inbox-dropdown">
                                <div className="inbox-header">
                                    <h4>Notifications</h4>
                                    {notifications.length > 0 && (
                                        <button className="clear-all-btn" onClick={handleClearInbox}>Clear All</button>
                                    )}
                                </div>
                                <div className="inbox-body">
                                    {notifications.length === 0 ? (
                                        <div className="empty-inbox">Your inbox is empty</div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div key={notif.id} className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}>
                                                <div className="notif-content" onClick={() => handleMarkAsRead(notif.id)}>
                                                    <strong className="notif-title">{notif.title}</strong>
                                                    <p className="notif-text">{notif.content}</p>
                                                    <span className="notif-time">{new Date(notif.created_at).toLocaleString()}</span>
                                                </div>
                                                <button className="delete-notif-btn" onClick={() => handleDeleteNotification(notif.id)}>✕</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="menu-backdrop" onClick={() => setShowInbox(false)} />
                        </>
                    )}
                </div>

                <div className="user-info">
                    <span className="welcome-text">👋 Welcome, </span>
                    <button
                        className="user-name-btn"
                        onClick={() => {
                            setShowProfileMenu(!showProfileMenu);
                            setShowInbox(false);
                        }}
                    >
                        {user.firstName}
                    </button>
                    <span className={`user-role ${user.role}`}>
                        {displayRole}
                    </span>
                </div>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                    <>
                        <div className="profile-menu">
                            <button
                                className="menu-item"
                                onClick={handleViewProfile}
                                type="button"
                            >
                                👤 View Profile
                            </button>
                            <button
                                className="menu-item"
                                onClick={handleEditProfile}
                                type="button"
                            >
                                ✏️ Edit Profile
                            </button>
                            <button
                                className="menu-item"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    setShowFavoritesModal(true);
                                }}
                                type="button"
                            >
                                ⭐ My Favorites
                            </button>
                            <div className="menu-divider"></div>
                            <button
                                className="menu-item logout"
                                onClick={handleLogout}
                                type="button"
                            >
                                🚪 Logout
                            </button>
                        </div>

                        {/* Backdrop to close menu when clicking outside */}
                        <div
                            className="menu-backdrop"
                            onClick={() => setShowProfileMenu(false)}
                        />
                    </>
                )}
            </div>

            <ViewProfileModal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
            />

            {/* Only render EditProfileModal when profileData is loaded */}
            {profileData && (
                <EditProfileModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    profileData={profileData}
                    onSave={handleSaveProfile}
                />
            )}

            <SponsorProfileModal
                isOpen={showSponsorModal}
                onClose={() => setShowSponsorModal(false)}
                profileData={sponsorData}
                onSave={handleSaveSponsorProfile}
            />

            <ViewSponsorProfileModal
                isOpen={showSponsorViewModal}
                onClose={() => setShowSponsorViewModal(false)}
            />

            <FavoritesModal
                isOpen={showFavoritesModal}
                onClose={() => setShowFavoritesModal(false)}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={closeToast}
            />
        </>
    );
};
