import React, { useState, useEffect } from 'react';
import { Article, LabelStatistics } from '../../types/article.types';
import { contentService } from '../../services/contentService';
import { NewsService } from '../../services/news.service';
import { LabelCloud } from './LabelCloud';
import { ArticleList } from './ArticleList';
import { ArticleSearchBox } from './ArticleSearchBox';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import './NewsHub.css';

export const NewsHub: React.FC = () => {
    const [allArticles, setAllArticles] = useState<Article[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [statistics, setStatistics] = useState<LabelStatistics | null>(null);
    const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
    const [selectedLabelType, setSelectedLabelType] = useState<'topic' | 'organ' | 'category' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(true);
    const [recommendations, setRecommendations] = useState<Article[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
        loadPersonalizedData();

        // Listen for favorite changes from the Modal!
        const handleSync = (e: any) => {
            const { articleId, isFavorite } = e.detail;
            setFavoriteIds(prev => {
                const next = new Set(prev);
                if (isFavorite) next.add(articleId);
                else next.delete(articleId);
                return next;
            });
        };
        window.addEventListener('favoriteChanged', handleSync);
        return () => window.removeEventListener('favoriteChanged', handleSync);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Load articles and statistics in parallel
            const [articles, stats] = await Promise.all([
                contentService.getArticles(),
                contentService.getStatistics()
            ]);

            setAllArticles(articles);

            const enhancedStats = {
                ...stats,
                allTopics: stats.allTopics || Object.keys(stats.topicDistribution || {}).sort(),
                allOrgans: stats.allOrgans || Object.keys(stats.organDistribution || {}).sort(),
                allCategories: stats.allCategories || Object.keys(stats.categoryDistribution || {}).sort()
            }

            setStatistics(enhancedStats);
        } catch (err: any) {
            setError(err.message || 'Failed to load articles');
        } finally {
            setIsLoading(false);
        }
    };

    // FETCH PERSONALIZED AI DATA ---
    const loadPersonalizedData = async () => {
        try {
            const [recs, favs] = await Promise.all([
                NewsService.getRecommendations(),
                NewsService.getFavorites()
            ]);

            const mapArticle = (item: any): Article => ({
                ...item,
                excerpt: item.summary || item.excerpt || '',
                content: item.content || '',
                crawledAt: item.created_at || item.crawledAt || new Date().toISOString(),
                // Safely convert comma-separated strings into arrays for the UI
                organTypes: typeof item.organs === 'string' ? item.organs.split(',').map((s: string) => s.trim()) : (item.organs || item.organTypes || []),
                topics: typeof item.topics === 'string' ? item.topics.split(',').map((s: string) => s.trim()) : (item.topics || []),
                categories: typeof item.categories === 'string' ? item.categories.split(',').map((s: string) => s.trim()) : (item.categories || [])
            });

            setRecommendations(recs.map(mapArticle));
            // Store IDs in a Set for super fast O(1) lookup when rendering the star buttons
            setFavoriteIds(new Set(favs.map(f => f.id)));
        } catch (err) {
            console.error("Failed to load personalized data", err);
        }
    };

    // TOGGLE FAVORITE HANDLER ---
    const handleToggleFavorite = async (articleId: string) => {
        const isFav = favoriteIds.has(articleId);
        try {
            if (isFav) {
                await NewsService.removeFavorite(articleId);
                // setFavoriteIds(prev => {
                //     const next = new Set(prev);
                //     next.delete(articleId);
                //     return next;
                // });
            } else {
                await NewsService.addFavorite(articleId);
                // setFavoriteIds(prev => {
                //     const next = new Set(prev);
                //     next.add(articleId);
                //     return next;
                // });
            }

            // Broadcast event so UI updates locally
            window.dispatchEvent(new CustomEvent('favoriteChanged', {
                detail: { articleId, isFavorite: !isFav }
            }));
        } catch (error) {
            console.error("Failed to toggle favorite", error);
        }
    };

    const handleLabelClick = async (label: string, type: 'topic' | 'organ' | 'category') => {
        // Clear filter if clicking the same label or empty string
        if (!label || label === selectedLabel) {
            setSelectedLabel(null);
            setSelectedLabelType(null);
            setFilteredArticles([]);
            return;
        }

        setSelectedLabel(label);
        setSelectedLabelType(type);

        try {
            const filters: any = {};
            if (type === 'topic') filters.topic = label;
            if (type === 'organ') filters.organ = label;
            if (type === 'category') filters.category = label;

            const filtered = await contentService.filterArticles(filters);
            setFilteredArticles(filtered);
        } catch (err: any) {
            setError(`Failed to filter articles: ${err.message}`);
            setFilteredArticles([]);
        }
    };

    const handleClearFilter = () => {
        setSelectedLabel(null);
        setSelectedLabelType(null);
        setFilteredArticles([]);
    };

    const handleSearchResults = (results: any) => {
        // Optionally handle search results
        // For now, the search component displays its own results
        console.log('Search results:', results);
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading news articles..." />;
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={loadData} />;
    }

    if (!statistics || allArticles.length === 0) {
        return (
            <div className="news-hub-empty">
                <div className="empty-state">
                    <div className="empty-icon">📰</div>
                    <h2>No Articles Available Yet</h2>
                    <p>Articles will appear here once the content crawler has been run.</p>
                    <div className="empty-instructions">
                        <h3>To populate articles:</h3>
                        <ol>
                            <li>Ensure backend is running on port 8080</li>
                            <li>Run crawler: <code>POST /api/content/crawl</code></li>
                            <li>Label articles: <code>POST /api/content/label</code></li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="news-hub-layout">
            <div className="news-hub-main">
                <div className="news-hub-header">
                    <h1 className="page-title">📰 News & Articles Hub</h1>
                    <p className="page-description">
                        Browse medical news from trusted sources, organized by AI.
                    </p>
                </div>

                <div style={{ display: showSearch ? 'block' : 'none' }}>
                    {/* <ArticleSearchBox onSearch={(res) => console.log(res)} /> */}
                    <ArticleSearchBox />
                </div>
                <div className="toggle-search-container">
                    <button className="toggle-search-btn" onClick={() => setShowSearch(!showSearch)}>
                        {showSearch ? '▲ Hide Search' : '▼ Show Search'}
                    </button>
                </div>

                <LabelCloud statistics={statistics!} selectedLabel={selectedLabel} onLabelClick={handleLabelClick} />

                <ArticleList
                    articles={filteredArticles}
                    selectedLabel={selectedLabel}
                    labelType={selectedLabelType}
                    onLabelClick={handleLabelClick}
                    onClearFilter={handleClearFilter}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                />
            </div>

            <aside className="news-hub-sidebar">
                <h3 className="ai-sidebar-title">✨ AI Recommended</h3>
                <p className="ai-sidebar-subtitle">Curated by Gemini based on your profile & favorites.</p>

                {recommendations.length === 0 ? (
                    <div className="ai-sidebar-loading">Loading AI picks...</div>
                ) : (
                    <div className="ai-article-list">
                        {recommendations.map(article => {
                            const isFav = favoriteIds.has(article.id);
                            return (
                                <div key={article.id} className="ai-article-card">
                                    <button
                                        onClick={() => handleToggleFavorite(article.id)}
                                        className={`ai-star-btn ${isFav ? 'active' : 'inactive'}`}
                                        title="Toggle Favorite"
                                    >
                                        {isFav ? '★' : '☆'}
                                    </button>

                                    <h4 className="ai-article-title">
                                        <a href={article.url} target="_blank" rel="noreferrer">
                                            {article.title}
                                        </a>
                                    </h4>

                                    <div className="ai-article-tags">
                                        {article.organTypes && article.organTypes.length > 0 && (
                                            <span className="ai-tag-organ">{article.organTypes[0]}</span>
                                        )}
                                        {article.topics && article.topics.length > 0 && (
                                            <span className="ai-tag-topic">{article.topics[0]}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </aside>
        </div>
    );
};
