import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ViewProfileModal } from '../profile/ViewProfileModal';
import { EditProfileModal } from '../profile/EditProfileModal';
import { Toast } from '../common/Toast';
import '../../styles/UserHeader.css';

export const UserHeader: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({
        show: false,
        message: '',
        type: 'success'
    });

    if (!user) return null;

    const handleViewProfile = () => {
        console.log('View Profile clicked'); // Debug log
        setShowProfileMenu(false);
        setShowViewModal(true);
        navigate('/profile-fill');
    };

    const handleEditProfile = () => {
        console.log('Edit Profile clicked'); // Debug log
        setShowProfileMenu(false);
        setShowEditModal(true);
        navigate('/profile-fill');
    };

    const handleLogout = () => {
        console.log('Logout clicked'); // Debug log
        setShowProfileMenu(false);
        logout();
    };

    const handleSaveProfile = () => {
        setToast({
            show: true,
            message: 'Profile saved successfully!',
            type: 'success'
        });
    };

    const closeToast = () => {
        setToast({ ...toast, show: false });
    };

    return (
        <>
            <div className="user-header">
                <div className="user-info">
                    <span className="welcome-text">👋 Welcome, </span>
                    <button
                        className="user-name-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        {user.firstName}
                    </button>
                    <span className={`user-role ${user.role}`}>
                        {user.role === 'patient' ? 'Patient' : 'Donor'}
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

            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleSaveProfile}
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
