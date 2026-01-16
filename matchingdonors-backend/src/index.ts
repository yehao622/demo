import "dotenv/config";
import express from "express";
import cors from "cors";
import profileRoutes from "./profile/routes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/profile", profileRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});