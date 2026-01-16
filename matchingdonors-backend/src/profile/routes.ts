import { Router } from "express";
import { buildProfilePrompt } from "./buildProfilePrompt";
import { callGemini } from "../common/geminiClient";
import { parseGeminiProfileResponse } from "./parseGeminiProfileResponse";
import console = require("node:console");

const router = Router();

router.post("/suggest", async (req, res) => {
    try {
        const { text } = req.body as { text?: string };

        if (!text || text.trim().length < 20) {
            return res.status(400).json({ error: "Text is too short" });
        }

        const prompt = buildProfilePrompt(text);
        const raw = await callGemini(prompt);
        // console.log("RAW GEMINI OUTPUT:\n", raw);
        const suggestion = parseGeminiProfileResponse(raw);

        res.json({ suggestion });
    } catch (err: any) {
        console.error("Patient suggest error:", err);
        res.status(500).json({ error: "Failed to generate suggestion" });
    }
});

export default router;