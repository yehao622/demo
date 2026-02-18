import React, { useEffect, useState } from 'react';
import { Article, NewsService } from '../../services/news.service';
import '../../styles/UserHeader.css'; // Reusing your existing modal styles

interface FavoritesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose }) => {
    const [favorites, setFavorites] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadFavorites();
        }
    }, [isOpen]);

    const loadFavorites = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await NewsService.getFavorites();
            setFavorites(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load favorites');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFavorite = async (articleId: string) => {
        try {
            await NewsService.removeFavorite(articleId);
            // Instantly remove it from the UI
            setFavorites(prev => prev.filter(article => article.id !== articleId));
        } catch (err: any) {
            console.error("Failed to remove favorite:", err);
            alert("Failed to remove article.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <span className="modal-icon">⭐</span>
                    <h3>My Favorite Articles</h3>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>Loading favorites...</div>
                    ) : error ? (
                        <div className="error-message">❌ {error}</div>
                    ) : favorites.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                            <p>You haven't saved any articles yet.</p>
                            <p style={{ fontSize: '0.9rem' }}>Go to the News Hub to find articles related to your profile!</p>
                        </div>
                    ) : (
                        <div className="favorites-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {favorites.map(article => (
                                <div key={article.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', position: 'relative' }}>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#333', paddingRight: '30px' }}>{article.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 10px 0' }}>{article.summary}</p>
                                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                                        <span style={{ background: '#e9ecef', padding: '3px 8px', borderRadius: '12px' }}>{article.source}</span>
                                        {article.organs && <span style={{ background: '#ffebee', color: '#c62828', padding: '3px 8px', borderRadius: '12px' }}>{article.organs}</span>}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFavorite(article.id)}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '1.2rem' }}
                                        title="Remove from favorites"
                                    >
                                        ★
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};