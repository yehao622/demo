import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import profileRoutes from "./profile/routes";
import matchingRoutes from './matching/matching.routes'
import contenRoutes from './routes/content'

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
// app.get('/health', (req, res) => {
//     res.json({
//         status: 'ok',
//         geminiKeySet: !!process.env.GEMINI_API_KEY,
//         timestamp: new Date().toISOString()
//     });
// });

app.use("/api/profile", profileRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/content", contenRoutes);

app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});