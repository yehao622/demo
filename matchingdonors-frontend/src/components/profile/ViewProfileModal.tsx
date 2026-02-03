import React, { useEffect, useState } from 'react';
import './ViewProfileModal.css';

interface ViewProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ProfileData {
    name: string;
    type: 'patient' | 'donor';
    age: number;
    blood_type: string;
    organ_type: string;
    city: string;
    state: string;
    country: string;
    description: string;
    medical_info: string;
}

export const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ isOpen, onClose }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:8080/api/profile/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            if (data.success && data.profile) {
                setProfile(data.profile);
            } else {
                setError('No profile found. Please complete your profile first.');
            }
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content view-profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>👤 View Profile</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading profile...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p className="error-message">❌ {error}</p>
                        </div>
                    ) : profile ? (
                        <div className="profile-content">
                            <div className="profile-section">
                                <h3>Basic Information</h3>
                                <div className="profile-grid">
                                    <div className="profile-field">
                                        <label>Name:</label>
                                        <span>{profile.name || 'Not provided'}</span>
                                    </div>
                                    <div className="profile-field">
                                        <label>Role:</label>
                                        <span className={`role-badge ${profile.type}`}>
                                            {profile.type === 'patient' ? '🏥 Patient' : '❤️ Donor'}
                                        </span>
                                    </div>
                                    <div className="profile-field">
                                        <label>Age:</label>
                                        <span>{profile.age || 'Not provided'}</span>
                                    </div>
                                    <div className="profile-field">
                                        <label>Blood Type:</label>
                                        <span>{profile.blood_type || 'Not provided'}</span>
                                    </div>
                                    <div className="profile-field">
                                        <label>Organ Type:</label>
                                        <span>{profile.organ_type || 'Not provided'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-section">
                                <h3>Location</h3>
                                <div className="profile-field">
                                    <label>Address:</label>
                                    <span>
                                        {profile.city && profile.state && profile.country
                                            ? `${profile.city}, ${profile.state}, ${profile.country}`
                                            : 'Not provided'}
                                    </span>
                                </div>
                            </div>

                            {profile.description && (
                                <div className="profile-section">
                                    <h3>Summary</h3>
                                    <p className="profile-text">{profile.description}</p>
                                </div>
                            )}

                            {profile.medical_info && (
                                <div className="profile-section">
                                    <h3>Personal Story</h3>
                                    <p className="profile-text">{profile.medical_info}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No profile information available.</p>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};
