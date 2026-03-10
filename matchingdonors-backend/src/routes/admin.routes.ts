import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { verifyAdmin } from '../middleware/auth.middleware';
import { GoogleGenAI } from '@google/genai';
import db from '../database/init';

const router = Router();

// Apply BOTH middlewares to every route in this file
router.use(authMiddleware);
router.use(verifyAdmin);

/**
 * GET /api/admin/users
 * Fetch all users for the admin dashboard
 */
router.get('/users', (req: Request, res: Response) => {
    try {
        // Fetch users, but EXCLUDE the password_hash for security!
        const users = db.prepare(`
            SELECT id, email, role, first_name, last_name, is_admin, is_active 
            FROM users 
            ORDER BY created_at DESC
        `).all() as any[];

        // Sanitize the database output to match the React frontend's User interface
        const sanitizedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            is_admin: Boolean(user.is_admin), // Convert 1/0 to true/false
            is_active: user.is_active !== 0
        }));

        res.json({
            success: true,
            users: sanitizedUsers
        });
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

/**
 * PATCH /api/admin/users/:id/status
 * Soft delete (suspend) or reactivate a user
 */
router.patch('/users/:id/status', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ success: false, error: 'is_active must be a boolean' });
        }

        // Convert the boolean back to a 1 or 0 for SQLite
        const sqliteIsActive = is_active ? 1 : 0;

        // Prevent the admin from accidentally suspending themselves!
        if (req.user?.id === Number(id)) {
            return res.status(400).json({ success: false, error: 'You cannot suspend your own admin account.' });
        }

        const result = db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(sqliteIsActive, id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            message: `User ${is_active ? 'reactivated' : 'suspended'} successfully.`
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, error: 'Failed to update user status' });
    }
});

/**
 * GET /api/admin/articles/unlabeled
 * Find all articles where Gemini failed to assign topics
 */
router.get('/articles/unlabeled', (req: Request, res: Response) => {
    try {
        // Hunt for articles where the topics column is empty, null, or an empty JSON array
        const unlabeledArticles = db.prepare(`
            SELECT id, title, source, url, publish_date 
            FROM articles 
            WHERE topics IS NULL 
               OR topics = '' 
               OR topics = '[]'
            ORDER BY publish_date DESC
        `).all();

        res.json({
            success: true,
            count: unlabeledArticles.length,
            articles: unlabeledArticles
        });
    } catch (error) {
        console.error('Error fetching unlabeled articles:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }
});

/**
 * POST /api/admin/articles/:id/retry
 * Force Gemini to retry labeling a specific article
 */
router.post('/articles/:id/retry', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Fetch the full article content
        const article = db.prepare('SELECT title, summary FROM articles WHERE id = ?').get(id) as any;

        if (!article) {
            return res.status(404).json({ success: false, error: 'Article not found' });
        }

        // 2. Initialize Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }
        const genAI = new GoogleGenAI({ apiKey });

        // 3. Ask Gemini to extract topics
        const prompt = `
            Analyze this medical article and provide a JSON array of 3 to 5 relevant medical topics or keywords.
            Only return the JSON array, nothing else. Example: ["kidney transplant", "dialysis", "donor matching"]
            
            Title: ${article.title}
            Content: ${article.summary}
        `;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        let topicsText = result.text?.trim() || '';

        // Clean up markdown formatting if Gemini includes it
        if (topicsText.startsWith('```json')) {
            topicsText = topicsText.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        // 4. Verify it's valid JSON and update the database
        JSON.parse(topicsText); // This will throw an error if Gemini gave a bad response

        db.prepare('UPDATE articles SET topics = ? WHERE id = ?').run(topicsText, id);

        res.json({
            success: true,
            message: 'Article successfully labeled!',
            topics: JSON.parse(topicsText)
        });
    } catch (error) {
        console.error('Error retrying AI labeler:', error);
        res.status(500).json({ success: false, error: 'Gemini failed to label this article. Please try again.' });
    }
});

export default router;