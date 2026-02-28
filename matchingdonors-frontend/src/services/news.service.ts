import api from './api';

export interface Article {
    id: string;
    title: string;
    summary: string;
    url: string;
    source: string;
    publish_date: string;
    topics: string;
    organs: string;
    categories: string;
}

export class NewsService {
    // 1. Fetch AI Personalized Recommendations
    static async getRecommendations(): Promise<Article[]> {
        const res = await api.get('/api/news/recommendations');
        return Array.isArray(res.data?.recommendations) ? res.data.recommendations : [];
    }

    // 2. Fetch User's Favorites
    static async getFavorites(): Promise<Article[]> {
        const res = await api.get('/api/news/favorites');
        return res.data.favorites;
    }

    // 3. Add to Favorites
    static async addFavorite(articleId: string): Promise<void> {
        await api.post('/api/news/favorites', { articleId });
    }

    // 4. Remove from Favorites
    static async removeFavorite(articleId: string): Promise<void> {
        await api.delete(`/api/news/favorites/${articleId}`);
    }
}