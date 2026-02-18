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
    private static getHeaders() {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    static async getNotifications(): Promise<AppNotification[]> {
        const res = await fetch('http://localhost:8080/api/notifications', {
            headers: this.getHeaders()
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data.notifications;
    }

    static async markAsRead(id: string): Promise<void> {
        const res = await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: this.getHeaders()
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
    }

    static async deleteNotification(id: string): Promise<void> {
        const res = await fetch(`http://localhost:8080/api/notifications/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
    }

    static async clearAll(): Promise<void> {
        const res = await fetch(`http://localhost:8080/api/notifications`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
    }
}