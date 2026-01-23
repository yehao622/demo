import React, { useState, useEffect } from 'react';
import { Article, LabelStatistics } from '../../types/article.types';
import { contentService } from '../../services/contentService';
import { LabelCloud } from './LabelCloud';
import { ArticleList } from './ArticleList';
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

    useEffect(() => {
        loadData();
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
        <div className="news-hub">
            <div className="news-hub-header">
                <h1 className="page-title">📰 News & Articles Hub</h1>
                <p className="page-description">
                    Browse medical news from trusted sources, organized by AI-labeled topics, organs, and categories
                </p>
            </div>

            {/* Label Cloud Section */}
            <LabelCloud
                statistics={statistics}
                selectedLabel={selectedLabel}
                onLabelClick={handleLabelClick}
            />

            {/* Article List Section */}
            <ArticleList
                articles={filteredArticles}
                selectedLabel={selectedLabel}
                labelType={selectedLabelType}
                onLabelClick={handleLabelClick}
                onClearFilter={handleClearFilter}
            />
        </div>
    );
};
