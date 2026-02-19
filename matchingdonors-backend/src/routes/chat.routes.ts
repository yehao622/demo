import { Router } from 'express';
import db from '../database/init';
import { authMiddleware } from '../middleware/auth.middleware';
import crypto from 'crypto';

const router = Router();

// Endpoint to get or create a chat room between a user and an advertiser
router.post('/room', authMiddleware, (req, res) => {
    const { advertiserId } = req.body;
    const userId = req.user?.id; // Access the user ID from the decoded JWT

    if (!userId || !advertiserId) {
        return res.status(400).json({ error: "Missing userId or advertiserId" });
    }

    try {
        // Check if a room already exists (using better-sqlite3 prepare)
        const existingRoom = db.prepare(
            `SELECT id FROM chat_rooms WHERE user_id = ? AND advertiser_id = ?`
        ).get(userId, advertiserId) as { id: string } | undefined;

        if (existingRoom) {
            return res.json({ roomId: existingRoom.id });
        }

        // If not, create a new room using Node's native random UUID generator
        const newRoomId = crypto.randomUUID();

        db.prepare(
            `INSERT INTO chat_rooms (id, user_id, advertiser_id) VALUES (?, ?, ?)`
        ).run(newRoomId, userId, advertiserId);

        res.json({ roomId: newRoomId });
    } catch (error) {
        console.error("Error fetching/creating chat room:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint to get message history for a specific room
router.get('/room/:roomId/messages', authMiddleware, (req, res) => {
    const { roomId } = req.params;

    try {
        // Fetch all messages for the room (using better-sqlite3 prepare.all)
        const messages = db.prepare(
            `SELECT * FROM messages WHERE room_id = ? ORDER BY created_at ASC`
        ).all(roomId);

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;