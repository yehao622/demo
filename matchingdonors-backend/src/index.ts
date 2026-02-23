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
import './database/init';

import http from 'http';
import { initSocket } from './socket';

const app = express();
const port = process.env.PORT || 8080;

const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
    console.log(`🚀 Server & Socket.IO running on port ${port}`);
});

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Health check endpoint
// app.get('/health', (req, res) => {
//     res.json({
//         status: 'ok',
//         geminiKeySet: !!process.env.GEMINI_API_KEY,
//         timestamp: new Date().toISOString()
//     });
// });

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