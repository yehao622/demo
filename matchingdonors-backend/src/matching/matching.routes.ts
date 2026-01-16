import { Router } from "express";
import { MatchingController } from "./matching.controller";

const router = Router();
const controller = new MatchingController();

router.post('/store', controller.storeProfile.bind(controller));
router.post('/find', controller.findMatches.bind(controller));
router.get('/profiles', controller.getAllProfiles.bind(controller));

export default router;