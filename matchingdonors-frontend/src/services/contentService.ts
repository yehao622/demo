import api from './api';
import {
    Article,
    ContentApiResponse,
    LabelStatistics,
    ArticleSearchResult,
    SearchApiResponse,
    SearchIndexStatus
} from '../types/article.types';

export const contentService = {
    // Get all labeled articles
    async getArticles(filters?: { source?: string; topics?: string }): Promise<Article[]> {
        try {
            const params = new URLSearchParams();
            if (filters?.source) params.append('source', filters.source);
            if (filters?.topics) params.append('topics', filters.topics);

            const response = await api.get<ContentApiResponse>('/api/content/articles', { params });
            return response.data.articles || [];
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to get articles');
        }
    },

    // Filter articles by label (topic, organ, or category)
    async filterArticles(filters: {
        topic?: string;
        organ?: string;
        category?: string;
    }): Promise<Article[]> {
        try {
            const params = new URLSearchParams();
            if (filters.topic) params.append('topic', filters.topic);
            if (filters.organ) params.append('organ', filters.organ);
            if (filters.category) params.append('category', filters.category);

            const response = await api.get<ContentApiResponse>('/api/content/articles/filter', { params });
            return response.data.articles || [];
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to filter articles');
        }
    },

    // Get labeling statistics for all articles
    async getStatistics(): Promise<LabelStatistics> {
        try {
            const response = await api.get<{ success: boolean; statistics: LabelStatistics }>('/api/content/statistics');
            return response.data.statistics;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to get statistics');
        }
    },

    // get article by ID
    async getArticleById(id: string): Promise<Article | null> {
        try {
            const response = await api.get<{ success: boolean; article: Article }>(`/api/content/articles/${id}`);
            return response.data.article;
        } catch (error: any) {
            if (error.response?.status === 404) return null;
            throw new Error(error.response?.data?.error || 'Failed to get article');
        }
    },

    // Search articles with AI-powered semantic search
    async searchArticles(query: string, options?: {
        topN?: number;
        minSimilarity?: number;
    }): Promise<ArticleSearchResult> {
        try {
            const response = await api.post<SearchApiResponse>('/api/content/search', {
                query,
                topN: options?.topN || 5,
                minSimilarity: options?.minSimilarity || 0.3
            });

            if (!response.data.success || !response.data.data) {
                throw new Error(response.data.error || 'Search failed');
            }

            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to search articles');
        }
    },

    // Get search index status
    async getSearchStatus(): Promise<SearchIndexStatus> {
        try {
            const response = await api.get<{ success: boolean; status: SearchIndexStatus }>('/api/content/search/status');
            return response.data.status;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to get search status');
        }
    }
};