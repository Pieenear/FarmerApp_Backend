import { Router } from "express";
import { createArea, getAreas, getAreaById } from "../controllers/area.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { Role } from "../generated/prisma/client.js";
const router = Router();
// Public routes
router.get("/", getAreas);
router.get("/:id", getAreaById);
// Admin-only route to create areas
router.post("/", authMiddleware, requireRole([Role.admin]), createArea);
export default router;
