import db from '../database/init';

export interface Notification {
    id: string;
    recipient_id: number;
    sender_id?: number;
    title: string;
    content: string;
    type: 'system' | 'message';
    is_read: boolean;
    created_at: string;
}

export class NotificationService {
    // 1. Send a message or system alert
    static createNotification(
        recipientId: number,
        title: string,
        content: string,
        type: 'system' | 'message',
        senderId?: number
    ): Notification {
        const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const stmt = db.prepare(`
            INSERT INTO notifications (id, recipient_id, sender_id, title, content, type)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(id, recipientId, senderId || null, title, content, type);

        return this.getNotificationById(id)!;
    }

    // 2. Fetch all notifications for a specific user
    static getUserNotifications(userId: number): Notification[] {
        const stmt = db.prepare(`
            SELECT * FROM notifications 
            WHERE recipient_id = ? 
            ORDER BY created_at DESC
        `);

        const rows = stmt.all(userId) as any[];
        return rows.map(row => ({
            ...row,
            is_read: row.is_read === 1
        }));
    }

    // 3. Get a single notification
    static getNotificationById(id: string): Notification | null {
        const stmt = db.prepare(`SELECT * FROM notifications WHERE id = ?`);
        const row = stmt.get(id) as any;
        if (!row) return null;
        return { ...row, is_read: row.is_read === 1 };
    }

    // 4. Mark notification as read
    static markAsRead(id: string, userId: number): boolean {
        const stmt = db.prepare(`
            UPDATE notifications 
            SET is_read = 1 
            WHERE id = ? AND recipient_id = ?
        `);
        const result = stmt.run(id, userId);
        return result.changes > 0;
    }

    // 5. Delete a single notification
    static deleteNotification(id: string, userId: number): boolean {
        const stmt = db.prepare(`
            DELETE FROM notifications 
            WHERE id = ? AND recipient_id = ?
        `);
        const result = stmt.run(id, userId);
        return result.changes > 0;
    }

    // 6. Delete all notifications for a user
    static deleteAllUserNotifications(userId: number): boolean {
        const stmt = db.prepare(`
            DELETE FROM notifications 
            WHERE recipient_id = ?
        `);
        const result = stmt.run(userId);
        return result.changes > 0;
    }
}