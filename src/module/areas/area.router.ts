import { Router } from "express";
import { createArea, getAreas, getAreaById } from "./area.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createAreaSchema } from "./area.schema.js";
import { Role } from "../../generated/prisma/client.js";

const router = Router();

// Public routes
router.get("/", getAreas);
router.get("/:id", getAreaById);

// Admin-only route to create areas, with Zod payload validation
router.post(
  "/",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(createAreaSchema),
  createArea
);

export default router;
