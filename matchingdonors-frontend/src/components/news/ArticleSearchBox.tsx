import React, { useState } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import './ArticleSearchBox.css';

interface ArticleMatch {
    article: {
        id: string;
        title: string;
        url: string;
        excerpt: string;
        source: string;
        publishDate?: Date;
        topics: string[];
        organTypes: string[];
        categories: string[];
    };
    similarity: number;
    rank: number;
    relevanceReason: string;
}

interface SearchResult {
    query: string;
    summary: string;
    matches: ArticleMatch[];
    queryAnalysis: {
        extractedOrgans: string[];
        extractedTopics: string[];
        intent: string;
    };
}

interface ArticleSearchBoxProps {
    onSearch?: (results: SearchResult) => void;
}

export const ArticleSearchBox: React.FC<ArticleSearchBoxProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTranscript = (transcript: string) => {
        setQuery(transcript);
    };

    const { isRecording, isTranscribing, error: voiceError, handleVoiceInput } = useVoiceInput(handleTranscript);

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('Please enter a search query');
            return;
        }

        setIsSearching(true);
        setError(null);
        setSearchResult(null);

        try {
            const response = await fetch('http://localhost:8080/api/content/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query.trim(),
                    topN: 5,
                    minSimilarity: 0.3
                }),
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                setSearchResult(data.data);
                if (onSearch) {
                    onSearch(data.data);
                }
            } else if (data.message && data.message.includes('No labeled articles')) {
                // Special handling for no articles case
                setError('No articles available. Please crawl and label articles first.');
                setSearchResult(null);
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to search articles');
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        }
    };

    const formatSource = (source: string): string => {
        const sourceMap: { [key: string]: string } = {
            'matchingdonors': 'MatchingDonors',
            'dailydiabetes': 'Daily Diabetes',
            'dailytransplant': 'Daily Transplant',
            'irishtransplant': 'Irish Transplant'
        };
        return sourceMap[source] || source;
    };

    const getSourceClass = (source: string): string => {
        const classMap: { [key: string]: string } = {
            'matchingdonors': 'source-md',
            'dailydiabetes': 'source-dd',
            'dailytransplant': 'source-dt',
            'irishtransplant': 'source-it'
        };
        return classMap[source] || 'source-default';
    };

    return (
        <div className="article-search-box">
            <div className="search-header">
                <h2 className="search-title">🔍 Smart Article Search</h2>
                <p className="search-description">
                    Ask questions about organ transplantation, and AI will find relevant articles with answers
                </p>
            </div>

            <div className="search-input-container">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="e.g., What should I know before kidney transplant?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSearching || isRecording || isTranscribing}
                    />
                    <button
                        className={`voice-button ${isRecording ? 'recording' : ''} ${isTranscribing ? 'transcribing' : ''}`}
                        onClick={handleVoiceInput}
                        disabled={isSearching || isTranscribing}
                        title={isRecording ? 'Stop recording' : 'Start voice input'}
                    >
                        {isRecording ? '⏹️' : isTranscribing ? '⏳' : '🎤'}
                    </button>

                    <button
                        className="search-button"
                        onClick={handleSearch}
                        disabled={isSearching || !query.trim() || isRecording || isTranscribing}
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {(voiceError || error) && (
                    <div className="search-error">
                        ⚠️ {voiceError || error}
                    </div>
                )}

                {isTranscribing && (
                    <div className="search-status">
                        🎙️ Transcribing audio...
                    </div>
                )}
            </div>

            {searchResult && (
                <div className="search-results">
                    {/* Query Analysis */}
                    {(searchResult.queryAnalysis.extractedOrgans.length > 0 ||
                        searchResult.queryAnalysis.extractedTopics.length > 0) && (
                            <div className="query-analysis">
                                <h4>📊 Query Analysis</h4>
                                <div className="analysis-content">
                                    {searchResult.queryAnalysis.extractedOrgans.length > 0 && (
                                        <div className="analysis-item">
                                            <span className="analysis-label">Organs:</span>
                                            <div className="analysis-chips">
                                                {searchResult.queryAnalysis.extractedOrgans.map((organ, idx) => (
                                                    <span key={idx} className="organ-chip">{organ}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {searchResult.queryAnalysis.extractedTopics.length > 0 && (
                                        <div className="analysis-item">
                                            <span className="analysis-label">Topics:</span>
                                            <div className="analysis-chips">
                                                {searchResult.queryAnalysis.extractedTopics.map((topic, idx) => (
                                                    <span key={idx} className="topic-chip">{topic}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* AI Summary */}
                    <div className="ai-summary">
                        <h3>💡 AI Summary</h3>
                        <p className="summary-text">{searchResult.summary}</p>
                    </div>

                    {/* Search Results */}
                    {searchResult.matches.length > 0 ? (
                        <div className="search-matches">
                            <h3>📚 Related Articles ({searchResult.matches.length})</h3>
                            <div className="matches-list">
                                {searchResult.matches.map((match) => (
                                    <div key={match.article.id} className="match-card">
                                        <div className="match-rank">#{match.rank}</div>
                                        <div className="match-content">
                                            <div className="match-header">
                                                <a
                                                    href={match.article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="match-title-link"
                                                >
                                                    <h4 className="match-title">{match.article.title}</h4>
                                                </a>
                                                <div className="match-meta">
                                                    <span className={`source-badge ${getSourceClass(match.article.source)}`}>
                                                        {formatSource(match.article.source)}
                                                    </span>
                                                    <span className="match-similarity">
                                                        {(match.similarity * 100).toFixed(0)}% match
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="match-excerpt">{match.article.excerpt}</p>
                                            <div className="match-relevance">
                                                <span className="relevance-label">Why relevant:</span>
                                                <span className="relevance-reason">{match.relevanceReason}</span>
                                            </div>
                                            {(match.article.topics.length > 0 || match.article.organTypes.length > 0) && (
                                                <div className="match-labels">
                                                    {match.article.organTypes.length > 0 && (
                                                        <div className="label-chips">
                                                            {match.article.organTypes.slice(0, 3).map((organ, idx) => (
                                                                <span key={idx} className="organ-chip">{organ}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {match.article.topics.length > 0 && (
                                                        <div className="label-chips">
                                                            {match.article.topics.slice(0, 3).map((topic, idx) => (
                                                                <span key={idx} className="topic-chip">{topic}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="no-matches">
                            <p>No matching articles found. Try different search terms.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};