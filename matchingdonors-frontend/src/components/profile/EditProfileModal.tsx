import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './EditProfileModal.css';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

interface ProfileFormData {
    summary: string;
    organType: string;
    age: string;
    bloodType: string;
    location: string;
    personalStory: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProfileFormData>({
        summary: '',
        organType: '',
        age: '',
        bloodType: '',
        location: '',
        personalStory: '',
    });

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
                const profile = data.profile;
                setFormData({
                    summary: profile.description || '',
                    organType: profile.organ_type || '',
                    age: profile.age ? String(profile.age) : '',
                    bloodType: profile.blood_type || '',
                    location: profile.city && profile.state
                        ? `${profile.city}, ${profile.state}, ${profile.country || 'USA'}`
                        : '',
                    personalStory: profile.medical_info || '',
                });
            }
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:8080/api/profile/update', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            if (data.success) {
                onSave();
                onClose();
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (err: any) {
            console.error('Error saving profile:', err);
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>✏️ Edit Profile</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading profile...</p>
                        </div>
                    ) : (
                        <div className="edit-form">
                            {error && (
                                <div className="error-banner">
                                    ❌ {error}
                                </div>
                            )}

                            <div className="form-section">
                                <h3>Basic Information</h3>

                                <div className="form-group">
                                    <label htmlFor="age">Age *</label>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        placeholder="Enter your age"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="bloodType">Blood Type *</label>
                                        <select
                                            id="bloodType"
                                            name="bloodType"
                                            value={formData.bloodType}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select blood type</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="organType">Organ Type *</label>
                                        <select
                                            id="organType"
                                            name="organType"
                                            value={formData.organType}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select organ</option>
                                            <option value="kidney">Kidney</option>
                                            <option value="liver">Liver</option>
                                            <option value="heart">Heart</option>
                                            <option value="lung">Lung</option>
                                            <option value="pancreas">Pancreas</option>
                                            <option value="bone-marrow">Bone Marrow</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="location">Location</label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="City, State, Country"
                                    />
                                    <small>Format: City, State, Country (e.g., Boston, MA, USA)</small>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Profile Details</h3>

                                <div className="form-group">
                                    <label htmlFor="summary">Summary</label>
                                    <textarea
                                        id="summary"
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleInputChange}
                                        placeholder="Brief summary about yourself"
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="personalStory">Personal Story / Medical Information</label>
                                    <textarea
                                        id="personalStory"
                                        name="personalStory"
                                        value={formData.personalStory}
                                        onChange={handleInputChange}
                                        placeholder="Share your story or medical details"
                                        rows={5}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={saving || loading}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
