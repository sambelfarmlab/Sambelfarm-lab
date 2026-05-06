import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import claudeRouter from "./claude";
import notionRouter from "./notion";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(claudeRouter);
router.use(notionRouter);

export default router;
