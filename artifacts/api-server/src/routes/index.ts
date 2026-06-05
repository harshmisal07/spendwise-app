import { Router, type IRouter } from "express";
import healthRouter from "./health";
import backupRouter from "./backup";
import aiInsightsRouter from "./ai-insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(backupRouter);
router.use(aiInsightsRouter);

export default router;
