export type ArticleSource = 'matchingdonors' | 'dailydiabetes' | 'dailytransplant' | 'irishtransplant';

export interface Article {
    id: string;
    source: ArticleSource;
    title: string;
    url: string;
    content: string;
    excerpt: string;
    publishDate?: Date;
    crawledAt: Date;
    topics: string[];
    organTypes: string[];
    categories: string[];
}

export interface LabelStatistics {
    totalArticles: number;
    labeledArticles: number;
    unlabeledArticles: number;
    topicDistribution: Record<string, number>;
    organDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
    allTopics: string[];
    allOrgans: string[];
    allCategories: string[];
}

export interface ContentApiResponse {
    success: boolean;
    count?: number;
    articles?: Article[];
    statistics?: LabelStatistics;
    error?: string;
}

// Search-related types
export interface ArticleMatch {
    article: Article;
    similarity: number;
    rank: number;
    relevanceReason: string;
}

export interface QueryAnalysis {
    extractedOrgans: string[];
    extractedTopics: string[];
    intent: string;
}

export interface ArticleSearchResult {
    query: string;
    summary: string;
    matches: ArticleMatch[];
    queryAnalysis: QueryAnalysis;
}

export interface SearchApiResponse {
    success: boolean;
    data?: ArticleSearchResult;
    error?: string;
}

export interface SearchIndexStatus {
    indexed: boolean;
    totalArticles: number;
    labeledArticles: number;
    indexedArticles: number;
    embeddingCount: number;
    ready: boolean;
}