// @ts-nocheck
import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import staffRouter from "./staff.js";
import tasksRouter from "./tasks.js";
import omegaRouter from "./omega.js";
import policiesRouter from "./policies.js";
import runtimeRouter from "./runtime.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/staff", staffRouter);
router.use("/tasks", tasksRouter);
// Omega Smart Read Layer — Phase 1 read-only endpoints
router.use("/omega", omegaRouter);
router.use("/policies", policiesRouter);
router.use("/runtime", runtimeRouter);

export default router;
