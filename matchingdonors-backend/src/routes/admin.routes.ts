import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { verifyAdmin } from '../middleware/auth.middleware';
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

export default router;