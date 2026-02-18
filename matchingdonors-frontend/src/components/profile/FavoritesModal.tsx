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
            setFavorites(prev => prev.filter(article => article.id !== articleId));
            // Broadcast an event so the NewsHub knows to update its stars instantly!
            window.dispatchEvent(new CustomEvent('favoriteChanged', {
                detail: { articleId, isFavorite: false }
            }));
        } catch (err: any) {
            console.error("Failed to remove favorite:", err);
            alert("Failed to remove article.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content favorites-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-icon">⭐</span>
                    <h3>My Favorite Articles</h3>
                </div>

                <div className="modal-body favorites-modal-body">
                    {isLoading ? (
                        <div className="favorites-loading">Loading favorites...</div>
                    ) : error ? (
                        <div className="error-message">❌ {error}</div>
                    ) : favorites.length === 0 ? (
                        <div className="favorites-empty">
                            <p>You haven't saved any articles yet.</p>
                            <p className="favorites-empty-sub">Go to the News Hub to find articles related to your profile!</p>
                        </div>
                    ) : (
                        <div className="favorites-list">
                            {favorites.map(article => (
                                <div key={article.id} className="favorite-item-card">
                                    <h4 className="favorite-item-title">
                                        {/* FIX 2: Added Hyperlink */}
                                        <a href={article.url} target="_blank" rel="noreferrer">
                                            {article.title}
                                        </a>
                                    </h4>
                                    <p className="favorite-item-summary">{article.summary}</p>
                                    <div className="favorite-meta-tags">
                                        <span className="favorite-tag-source">{article.source}</span>
                                        {article.organs && (
                                            <span className="favorite-tag-organ">{article.organs}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFavorite(article.id)}
                                        className="favorite-remove-btn"
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