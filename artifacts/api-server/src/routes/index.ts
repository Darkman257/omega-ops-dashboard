// @ts-nocheck
import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import staffRouter from "./staff.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/staff", staffRouter);

export default router;
