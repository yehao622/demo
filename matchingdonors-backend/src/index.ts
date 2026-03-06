import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
// import profileRoutes from "./profile/routes";
import profileRoutes from "./routes/profileRoutes";
import suggestRoutes from "./profile/suggest.routes";
import matchingRoutes from './matching/matching.routes'
import contenRoutes from './routes/content'
import advertiseRoutes from './routes/advertiser'
import authRoutes from './routes/auth.routes';
import notificationRoutes from './routes/notification.routes';
import newsRoutes from './routes/news.routes';
import chatRoutes from './routes/chat.routes';
import sponsorProfileRoutes from './routes/sponsorProfile.routes';
import adminRoutes from './routes/admin.routes';
import db from './database/init';

import http from 'http';
import { initSocket } from './socket';

const app = express();
const port = process.env.PORT || 8080;

// Middleware MUST come first!
app.use(cors({
    origin: [
        'http://localhost:3000',
        process.env.FRONTEND_URL || ''
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/profile", suggestRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/content", contenRoutes);
app.use("/api/advertiser", advertiseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sponsor-profile', sponsorProfileRoutes);
app.use("/api/admin", adminRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
initSocket(server);

// This runs every 60,000 milliseconds (1 minute)
setInterval(() => {
    try {
        // Find and delete any user suspended more than 5 minutes ago
        const result = db.prepare(`
            DELETE FROM users 
            WHERE is_active = 0 
            AND updated_at <= datetime('now', '-30 days')
        `).run();

        if (result.changes > 0) {
            console.log(`🧹 Auto-Cleanup: Permanently hard-deleted ${result.changes} suspended user(s) and all their associated data.`);
        }
    } catch (error) {
        console.error('Error during auto-hard-delete cron job:', error);
    }
}, 3600000);

server.listen(port, () => {
    console.log(`🚀 Server & Socket.IO running on port ${port}`);
});