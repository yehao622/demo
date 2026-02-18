import { Router } from "express";
import { NotificationService } from "../services/notification.service";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All routes require the user to be logged in
router.use(authMiddleware);

// GET /api/notifications - Get user's inbox
router.get('/', (req, res) => {
    try {
        // TypeScript safety check
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const notifications = NotificationService.getUserNotifications(req.user.id);
        res.json({ success: true, notifications });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/notifications - Send a direct message to another user
router.post('/', (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { recipientId, title, content } = req.body;
        const senderId = req.user.id; // Logged in user

        const notification = NotificationService.createNotification(
            recipientId,
            title,
            content,
            'message',
            senderId
        );
        res.json({ success: true, notification });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const success = NotificationService.markAsRead(req.params.id, req.user.id);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/notifications/:id - Delete one message
router.delete('/:id', (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const success = NotificationService.deleteNotification(req.params.id, req.user.id);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/notifications - Clear whole inbox
router.delete('/', (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const success = NotificationService.deleteAllUserNotifications(req.user.id);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;