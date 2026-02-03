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
import './database/init';

const app = express();
const port = process.env.PORT || 8080;

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

app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});