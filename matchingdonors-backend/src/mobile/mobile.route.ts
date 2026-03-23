import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { ProfileService } from '../services/profile.service';
import { MatchingService } from '../matching/matching.service';
import db from '../database/init';

const router = express.Router();

// 🚀 REAL AI MATCHING ROUTE (Moved from index.ts)
router.get('/matches', authMiddleware, async (req: any, res: any) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role as 'patient' | 'donor';

        const myProfile = ProfileService.getUserProfile(userId, userRole);

        if (!myProfile || !myProfile.organ_type) {
            return res.status(200).json({ matches: [] });
        }

        const targetType = userRole === 'patient' ? 'donor' : 'patient';
        const searchCriteria = `Blood type ${myProfile.blood_type || ''} Age ${myProfile.age || ''} Organ ${myProfile.organ_type}. ${myProfile.description || ''}`;

        const matchingService = new MatchingService();
        const searchResult = await matchingService.searchRealProfiles(
            searchCriteria,
            targetType,
            userId,
            10,
            50,
            true
        );

        const formattedMatches = (searchResult.matches || []).map(match => {
            const locationString = `${match.profile.city || ''}, ${match.profile.state || ''}`
                .replace(/^,\s*|,\s*$/g, '') || 'Location unknown';

            return {
                id: match.profileId,
                name: match.profile.name || 'Anonymous User',
                bloodType: match.profile.blood_type || 'Unknown',
                location: locationString,
                similarity: Math.round(match.similarity * 100)
            };
        });

        res.status(200).json({ matches: formattedMatches });

    } catch (error) {
        console.error('Error fetching real AI matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// NEW: Get the latest articles for the mobile news feed
router.get('/news', authMiddleware, async (req: any, res: any) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role as 'patient' | 'donor';

        // Directly query the DB to guarantee we get the 'embedding' column!
        const myProfile = db.prepare(`
            SELECT organ_type, embedding 
            FROM profiles 
            WHERE user_id = ? AND type = ?
        `).get(userId, userRole) as any;

        // Fetch all articles from the database
        const articles = db.prepare(`
            SELECT id, title, summary, url, source, publish_date, embedding 
            FROM articles 
        `).all() as any[];

        // If the user hasn't completed their profile, just return the newest articles
        if (!myProfile || !myProfile.embedding) {
            const sortedByDate = articles.sort((a, b) =>
                new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
            ).slice(0, 10);

            // Strip embeddings before sending to mobile to prevent crashes
            const cleanDefault = sortedByDate.map(({ embedding, ...rest }) => rest);
            return res.json(cleanDefault);
        }

        // Parse the user's vector
        const userEmbedding = typeof myProfile.embedding === 'string'
            ? JSON.parse(myProfile.embedding)
            : myProfile.embedding

        const matchingService = new MatchingService();

        // 4. Score every article against the user's medical needs
        const scoredArticles = articles.map(article => {
            let similarity = 0;
            if (article.embedding) {
                try {
                    const articleVector = typeof article.embedding === 'string'
                        ? JSON.parse(article.embedding)
                        : article.embedding;

                    // Compare the user's medical profile to the article's content!
                    similarity = matchingService.computeSimilarity(userEmbedding, articleVector);
                } catch (e) {
                    console.error('Failed to parse article embedding', e);
                }
            }
            return { ...article, similarity };
        });

        // 5. Sort by AI Similarity (highest first) and return the top 10
        const topMatches = scoredArticles
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);

        // Remove the heavy embedding array before sending to the mobile app
        const cleanResponse = topMatches.map(({ embedding, ...rest }) => rest);

        res.json(cleanResponse);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

export default router;