import api from './api';

export interface AppNotification {
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
    static async getNotifications(): Promise<AppNotification[]> {
        const response = await api.get('/api/notifications');
        return response.data.notifications;
    }

    static async markAsRead(id: string): Promise<void> {
        await api.put(`/api/notifications/${id}/read`);
    }

    static async deleteNotification(id: string): Promise<void> {
        await api.delete(`/api/notifications/${id}`);
    }

    static async clearAll(): Promise<void> {
        await api.delete(`/api/notifications`);
    }
}