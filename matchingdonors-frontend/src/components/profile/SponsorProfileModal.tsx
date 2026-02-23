import React, { useState, useEffect } from 'react';
import { SponsorProfileData } from '../../services/sponsorProfile.service';
import '../../styles/AuthModals.css';
import './SponsorProfileModal.css';

interface SponsorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileData: SponsorProfileData | null;
    onSave: (data: SponsorProfileData) => Promise<void>;
}

export const SponsorProfileModal: React.FC<SponsorProfileModalProps> = ({ isOpen, onClose, profileData, onSave }) => {
    const [formData, setFormData] = useState<SponsorProfileData>({
        sponsor_type: 'organization',
        organization_name: '',
        contact_phone: '',
        website: '',
        interests: '',
        additional_notes: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (profileData) {
            setFormData({
                sponsor_type: profileData.sponsor_type || 'organization',
                organization_name: profileData.organization_name || '',
                contact_phone: profileData.contact_phone || '',
                website: profileData.website || '',
                interests: profileData.interests || '',
                additional_notes: profileData.additional_notes || ''
            });
        }
    }, [profileData, isOpen]);

    if (!isOpen) return null;

    const handleInterestToggle = (interest: string) => {
        const currentInterests = formData.interests ? formData.interests.split(',') : [];
        let newInterests;
        if (currentInterests.includes(interest)) {
            newInterests = currentInterests.filter(i => i !== interest);
        } else {
            newInterests = [...currentInterests, interest];
        }
        setFormData({ ...formData, interests: newInterests.join(',') });
    };

    const isInterestedIn = (interest: string) => {
        return formData.interests ? formData.interests.split(',').includes(interest) : false;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await onSave(formData);
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content sponsor-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    <h2>🤝 Sponsor & Collaboration Profile</h2>
                    <p>Tell us how you'd like to partner with MatchingDonors</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Are you an individual or an organization?</label>
                        <div className="sponsor-type-group">
                            <label className="sponsor-radio-label">
                                <input
                                    type="radio"
                                    name="sponsor_type"
                                    value="organization"
                                    className="sponsor-radio-input"
                                    checked={formData.sponsor_type === 'organization'}
                                    onChange={(e) => setFormData({ ...formData, sponsor_type: e.target.value as any })}
                                /> Organization / Business
                            </label>
                            <label className="sponsor-radio-label">
                                <input
                                    type="radio"
                                    name="sponsor_type"
                                    value="individual"
                                    className="sponsor-radio-input"
                                    checked={formData.sponsor_type === 'individual'}
                                    onChange={(e) => setFormData({ ...formData, sponsor_type: e.target.value as any })}
                                /> Individual
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{formData.sponsor_type === 'organization' ? 'Organization/Company Name' : 'Full Name'}</label>
                        <input
                            type="text"
                            value={formData.organization_name}
                            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                            placeholder="e.g. HealthCorp Inc."
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Phone</label>
                            <input
                                type="tel"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div className="form-group">
                            <label>Website (Optional)</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://www.example.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Areas of Interest (Select all that apply)</label>
                        <div className="interests-container">
                            <label className="interest-item">
                                <input
                                    type="checkbox"
                                    className="interest-checkbox"
                                    checked={isInterestedIn('advertising')}
                                    onChange={() => handleInterestToggle('advertising')}
                                />
                                📢 Advertising on MatchingDonors
                            </label>
                            <label className="interest-item">
                                <input
                                    type="checkbox"
                                    className="interest-checkbox"
                                    checked={isInterestedIn('financial_funding')}
                                    onChange={() => handleInterestToggle('financial_funding')}
                                />
                                💰 Financial Funding / Grants
                            </label>
                            <label className="interest-item">
                                <input
                                    type="checkbox"
                                    className="interest-checkbox"
                                    checked={isInterestedIn('property_donation')}
                                    onChange={() => handleInterestToggle('property_donation')}
                                />
                                🏡 Property Donation (Real Estate, Vehicles, Boats)
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Additional Notes / How can we help you?</label>
                        <textarea
                            className="notes-textarea"
                            value={formData.additional_notes}
                            onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                            placeholder="Please provide any details about your collaboration interests..."
                            rows={3}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '10px' }}>
                        {isLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};