import { Router, type IRouter } from "express";
import healthRouter from "./health";
import backupRouter from "./backup";
import aiInsightsRouter from "./ai-insights";
import aiChatRouter from "./ai-chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(backupRouter);
router.use(aiInsightsRouter);
router.use(aiChatRouter);

export default router;
