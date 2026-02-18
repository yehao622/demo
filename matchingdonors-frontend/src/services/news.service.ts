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
    private static getHeaders() {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // 1. Fetch AI Personalized Recommendations
    static async getRecommendations(): Promise<Article[]> {
        const res = await fetch('http://localhost:8080/api/news/recommendations', {
            headers: this.getHeaders()
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data.recommendations;
    }

    // 2. Fetch User's Favorites
    static async getFavorites(): Promise<Article[]> {
        const res = await fetch('http://localhost:8080/api/news/favorites', {
            headers: this.getHeaders()
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data.favorites;
    }

    // 3. Add to Favorites
    static async addFavorite(articleId: string): Promise<void> {
        const res = await fetch('http://localhost:8080/api/news/favorites', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ articleId })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
    }

    // 4. Remove from Favorites
    static async removeFavorite(articleId: string): Promise<void> {
        const res = await fetch(`http://localhost:8080/api/news/favorites/${articleId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
    }
}