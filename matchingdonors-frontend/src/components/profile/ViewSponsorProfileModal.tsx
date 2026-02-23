import React, { useEffect, useState } from 'react';
import { SponsorProfileService, SponsorProfileData } from '../../services/sponsorProfile.service';
import '../../styles/AuthModals.css';
import './ViewSponsorProfileModal.css';

interface ViewSponsorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ViewSponsorProfileModal: React.FC<ViewSponsorProfileModalProps> = ({ isOpen, onClose }) => {
    const [data, setData] = useState<SponsorProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            SponsorProfileService.getProfile()
                .then(res => {
                    if (res.profile) {
                        setData(res.profile);
                    } else {
                        setError('No collaboration profile found. Please edit your profile first.');
                    }
                })
                .catch(err => setError('Failed to load profile details.'))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatInterests = (interestsStr?: string) => {
        if (!interestsStr) return 'None specified';
        const map: Record<string, string> = {
            'advertising': '📢 Advertising',
            'financial_funding': '💰 Financial Funding',
            'property_donation': '🏡 Property Donation'
        };
        return interestsStr.split(',').map(i => map[i] || i).join(', ');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <div className="modal-header">
                    <h2>🤝 Collaboration Details</h2>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading profile...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : data && (
                    <div className="view-sponsor-content">
                        <div className="info-row">
                            <strong>Type:</strong>
                            <span>{data.sponsor_type === 'organization' ? 'Organization' : 'Individual'}</span>
                        </div>
                        <div className="info-row">
                            <strong>Name:</strong>
                            <span>{data.organization_name || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <strong>Contact Phone:</strong>
                            <span>{data.contact_phone || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <strong>Website:</strong>
                            <span>{data.website ? <a href={data.website} target="_blank" rel="noreferrer">{data.website}</a> : 'N/A'}</span>
                        </div>
                        <div className="interests-box">
                            <strong>Interests:</strong>
                            <p>{formatInterests(data.interests)}</p>
                        </div>
                        {data.additional_notes && (
                            <div className="info-row">
                                <strong>Additional Notes:</strong>
                                <p className="notes-box">{data.additional_notes}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="modal-footer" style={{ marginTop: '20px' }}>
                    <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close</button>
                </div>
            </div>
        </div>
    );
};