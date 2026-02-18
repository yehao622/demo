import db from '../database/init';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required');
const genAI = new GoogleGenAI({ apiKey });

export class NewsService {
    // 1. Get all articles (for the general feed)
    static getAllArticles(limit = 20) {
        const stmt = db.prepare('SELECT * FROM articles ORDER BY created_at DESC LIMIT ?');
        return stmt.all(limit);
    }

    // 2. Add an article to favorites
    static addFavorite(userId: number, articleId: string) {
        try {
            const stmt = db.prepare('INSERT INTO favorite_articles (user_id, article_id) VALUES (?, ?)');
            stmt.run(userId, articleId);
            return true;
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return true; // Already favorited
            throw error;
        }
    }

    // 3. Remove an article from favorites
    static removeFavorite(userId: number, articleId: string) {
        const stmt = db.prepare('DELETE FROM favorite_articles WHERE user_id = ? AND article_id = ?');
        stmt.run(userId, articleId);
        return true;
    }

    // 4. Get a user's favorite articles
    static getFavorites(userId: number) {
        const stmt = db.prepare(`
            SELECT a.* FROM articles a
            JOIN favorite_articles fa ON a.id = fa.article_id
            WHERE fa.user_id = ?
            ORDER BY fa.created_at DESC
        `);
        return stmt.all(userId);
    }

    // 5. THE AI RECOMMENDATION ENGINE
    static async getPersonalizedRecommendations(userId: number) {
        // A. Fetch the User's Profile
        const profileStmt = db.prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1');
        const userProfile: any = profileStmt.get(userId);

        // B. Fetch the User's Favorites (to understand their reading habits)
        const favorites: any[] = this.getFavorites(userId);

        // C. Fetch candidate articles (recent 50 articles)
        const candidates: any[] = this.getAllArticles(50);

        if (candidates.length === 0) return [];

        // D. Construct the Prompt for Gemini
        let prompt = `You are a medical news curation AI for a transplant matching platform.
            Your job is to select the top 5 most relevant articles for a user based on their medical profile and reading history.
            --- USER PROFILE ---
            Role: ${userProfile ? userProfile.type : 'Unknown'}
            Organ Focus: ${userProfile ? userProfile.organ_type : 'General'}
            Medical Info: ${userProfile ? userProfile.medical_info : 'None'}
            `;

        if (favorites.length > 0) {
            prompt += `\n--- USER'S FAVORITE ARTICLES (Reading History) ---\n`;
            favorites.slice(0, 5).forEach(fav => {
                prompt += `- Title: ${fav.title}\n`;
            });
        }

        prompt += `\n--- AVAILABLE ARTICLES TO CHOOSE FROM ---\n`;
        candidates.forEach(article => {
            prompt += `[ID: ${article.id}] Title: ${article.title} | Summary: ${article.summary}\n`;
        });

        prompt += `
            \nAnalyze the user's profile and reading history, then select the 5 most highly relevant article IDs from the available list.
            Return ONLY a valid JSON array of the 5 article IDs as strings.
            Example output: ["art-123", "art-456", "art-789", "art-101", "art-102"]`;

        try {
            // E. Ask Gemini to rank and select
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const text = response.text || '';
            const jsonMatch = text.match(/\[.*\]/s);

            if (!jsonMatch) throw new Error("AI did not return a valid JSON array");

            const recommendedIds: string[] = JSON.parse(jsonMatch[0]);

            // F. Map the IDs back to the actual article objects
            const recommendedArticles = recommendedIds
                .map(id => candidates.find(c => c.id === id))
                .filter(Boolean); // Remove any nulls if the AI hallucinated an ID

            return recommendedArticles;
        } catch (error) {
            console.error("AI Recommendation Error:", error);
            // Fallback: If AI fails, just return the most recent matching organs, or generic recent news
            return candidates.slice(0, 5);
        }
    }
}