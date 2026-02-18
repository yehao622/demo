import { Router } from "express";
import { NewsService } from "../services/news.service";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Get general news (publicly accessible)
router.get('/', (req, res) => {
    try {
        const articles = NewsService.getAllArticles();
        res.json({ success: true, articles });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// All routes below require login
router.use(authMiddleware);

// Get AI recommendations for the logged-in user
router.get('/recommendations', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const recommendations = await NewsService.getPersonalizedRecommendations(req.user.id);
        res.json({ success: true, recommendations });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user's favorites
router.get('/favorites', (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const favorites = NewsService.getFavorites(req.user.id);
        res.json({ success: true, favorites });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add to favorites
router.post('/favorites', (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { articleId } = req.body;
        NewsService.addFavorite(req.user.id, articleId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove from favorites
router.delete('/favorites/:articleId', (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        NewsService.removeFavorite(req.user.id, req.params.articleId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;