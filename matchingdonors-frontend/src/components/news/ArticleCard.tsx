import React from 'react';
import { Article } from '../../types/article.types';
import './ArticleCard.css';

interface ArticleCardProps {
    article: Article;
    onLabelClick: (label: string, type: 'topic' | 'organ' | 'category') => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
    article,
    onLabelClick,
    isFavorite,
    onToggleFavorite
}) => {
    const getSourceBadgeColor = (source: string) => {
        const colors: Record<string, string> = {
            'matchingdonors': 'source-md',
            'dailydiabetes': 'source-dd',
            'dailytransplant': 'source-dt',
            'irishtransplant': 'source-it'
        };
        return colors[source] || 'source-default';
    };

    const formatDate = (date?: Date) => {
        if (!date) return 'Date unknown';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getExcerpt = (text: string, maxLength: number = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    return (
        <div className="article-card">
            <button
                onClick={(e) => {
                    e.preventDefault(); // Prevents accidental scrolling
                    onToggleFavorite();
                }}
                className={`article-card-favorite-btn ${isFavorite ? 'active' : 'inactive'}`}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
                {isFavorite ? '★' : '☆'}
            </button>

            <div className="article-card-header">
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="article-title-link"
                >
                    <h3 className="article-title">{article.title}</h3>
                </a>
                <div className="article-meta">
                    <span className={`source-badge ${getSourceBadgeColor(article.source)}`}>
                        {article.source.toUpperCase()}
                    </span>
                    <span className="article-date">{formatDate(article.publishDate)}</span>
                </div>
            </div>

            <p className="article-excerpt">{getExcerpt(article.excerpt)}</p>

            <div className="article-labels">
                {/* Topics */}
                {article.topics && article.topics.length > 0 && (
                    <div className="label-group">
                        <span className="label-group-title">Topics:</span>
                        <div className="label-chips">
                            {article.topics.map((topic, index) => (
                                <button
                                    key={`topic-${index}`}
                                    className="label-chip topic-chip"
                                    onClick={() => onLabelClick(topic, 'topic')}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Organs */}
                {article.organTypes && article.organTypes.length > 0 && (
                    <div className="label-group">
                        <span className="label-group-title">Organs:</span>
                        <div className="label-chips">
                            {article.organTypes.map((organ, index) => (
                                <button
                                    key={`organ-${index}`}
                                    className="label-chip organ-chip"
                                    onClick={() => onLabelClick(organ, 'organ')}
                                >
                                    {organ}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories */}
                {article.categories && article.categories.length > 0 && (
                    <div className="label-group">
                        <span className="label-group-title">Categories:</span>
                        <div className="label-chips">
                            {article.categories.map((category, index) => (
                                <button
                                    key={`category-${index}`}
                                    className="label-chip category-chip"
                                    onClick={() => onLabelClick(category, 'category')}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="article-card-footer">
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-more-btn"
                >
                    Read Full Article →
                </a>
            </div>
        </div>
    );
};
