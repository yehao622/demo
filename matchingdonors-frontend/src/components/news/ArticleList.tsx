import React from 'react';
import { Article } from '../../types/article.types';
import { ArticleCard } from './ArticleCard';
import './ArticleList.css';

interface ArticleListProps {
    articles: Article[];
    selectedLabel: string | null;
    labelType: 'topic' | 'organ' | 'category' | null;
    onLabelClick: (label: string, type: 'topic' | 'organ' | 'category') => void;
    onClearFilter: () => void;
    favoriteIds: Set<string>;
    onToggleFavorite: (articleId: string) => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
    articles,
    selectedLabel,
    labelType,
    onLabelClick,
    onClearFilter,
    favoriteIds,
    onToggleFavorite
}) => {
    if (!selectedLabel) {
        return (
            <div className="article-list-placeholder">
                <div className="placeholder-icon">👆</div>
                <h3>Select a Label to View Articles</h3>
                <p>Click on any topic, organ type, or category above to see related articles</p>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="article-list-empty">
                <div className="empty-icon">📰</div>
                <h3>No Articles Found</h3>
                <p>No articles match the selected filter: <strong>{selectedLabel}</strong></p>
                <button className="clear-filter-btn" onClick={onClearFilter}>
                    Clear Filter
                </button>
            </div>
        );
    }

    const getLabelTypeDisplay = () => {
        switch (labelType) {
            case 'topic': return '🏷️ Topic';
            case 'organ': return '🫀 Organ';
            case 'category': return '📂 Category';
            default: return 'Label';
        }
    };

    return (
        <div className="article-list">
            <div className="article-list-header">
                <div className="filter-info">
                    <span className="filter-label">Showing articles for:</span>
                    <div className="active-filter">
                        <span className="filter-type">{getLabelTypeDisplay()}</span>
                        <span className="filter-value">{selectedLabel}</span>
                        <button className="clear-filter-icon" onClick={onClearFilter} title="Clear filter">
                            ✕
                        </button>
                    </div>
                </div>
                <div className="article-count">
                    {articles.length} {articles.length === 1 ? 'Article' : 'Articles'}
                </div>
            </div>

            <div className="articles-grid">
                {articles.map((article) => (
                    <ArticleCard
                        key={article.id}
                        article={article}
                        onLabelClick={onLabelClick}
                        isFavorite={favoriteIds.has(article.id)}
                        onToggleFavorite={() => onToggleFavorite(article.id)}
                    />
                ))}
            </div>
        </div>
    );
};
