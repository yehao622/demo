import express from "express";
import { MatchingController } from "./matching.controller";

const router = express.Router();
const controller = new MatchingController();

// router.post('/store', controller.storeProfile.bind(controller));
router.post('/find', controller.findMatches.bind(controller));
router.get('/profiles', controller.getAllProfiles.bind(controller));
router.get('/real-profiles', controller.getRealProfiles.bind(controller));


export default router;