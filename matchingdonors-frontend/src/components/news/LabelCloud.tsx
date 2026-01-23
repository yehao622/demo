import React from 'react';
import { LabelStatistics } from '../../types/article.types';
import './LabelCloud.css';

interface LabelCloudProps {
    statistics: LabelStatistics;
    selectedLabel: string | null;
    onLabelClick: (label: string, type: 'topic' | 'organ' | 'category') => void;
}

export const LabelCloud: React.FC<LabelCloudProps> = ({
    statistics,
    selectedLabel,
    onLabelClick
}) => {
    const renderLabelSection = (
        title: string,
        icon: string,
        labels: string[],
        distribution: Record<string, number>,
        type: 'topic' | 'organ' | 'category',
        colorClass: string
    ) => {
        if (labels.length === 0) {
            return (
                <div className="label-section">
                    <h3 className="label-section-title">
                        <span className="section-icon">{icon}</span>
                        {title}
                    </h3>
                    <p className="no-labels">No {title.toLowerCase()} available yet</p>
                </div>
            );
        }

        return (
            <div className="label-section">
                <h3 className="label-section-title">
                    <span className="section-icon">{icon}</span>
                    {title}
                </h3>
                <div className="label-chips-container">
                    {labels.map((label) => {
                        const count = distribution[label] || 0;
                        const isSelected = selectedLabel === label;

                        return (
                            <button
                                key={label}
                                className={`label-chip-large ${colorClass} ${isSelected ? 'selected' : ''}`}
                                onClick={() => onLabelClick(label, type)}
                                title={`${count} ${count === 1 ? 'article' : 'articles'}`}
                            >
                                <span className="label-text">{label}</span>
                                <span className="label-count">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="label-cloud">
            <div className="label-cloud-header">
                <h2 className="cloud-title">🏷️ Browse by Labels</h2>
                <div className="stats-summary">
                    <div className="stat-item">
                        <span className="stat-value">{statistics.totalArticles}</span>
                        <span className="stat-label">Total Articles</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{statistics.labeledArticles}</span>
                        <span className="stat-label">Labeled</span>
                    </div>
                    {selectedLabel && (
                        <button
                            className="clear-all-btn"
                            onClick={() => onLabelClick('', 'topic')}
                        >
                            Clear Selection
                        </button>
                    )}
                </div>
            </div>

            <div className="label-sections">
                {renderLabelSection(
                    'Topics',
                    '🏷️',
                    statistics.allTopics,
                    statistics.topicDistribution,
                    'topic',
                    'topic-color'
                )}

                {renderLabelSection(
                    'Organ Types',
                    '🫀',
                    statistics.allOrgans,
                    statistics.organDistribution,
                    'organ',
                    'organ-color'
                )}

                {renderLabelSection(
                    'Categories',
                    '📂',
                    statistics.allCategories,
                    statistics.categoryDistribution,
                    'category',
                    'category-color'
                )}
            </div>
        </div>
    );
};
