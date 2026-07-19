import { Router } from "express";
import { createArea, getAreas, getAreaById, updateArea, deleteArea } from "./area.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createAreaSchema, updateAreaSchema } from "./area.schema.js";
import { Role } from "../../generated/prisma/client.js";

const router = Router();

// Public routes
router.get("/", getAreas);
router.get("/:id", getAreaById);

// Admin-only routes to create, update, and delete areas
router.post(
  "/",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(createAreaSchema),
  createArea
);

router.patch(
  "/:id",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(updateAreaSchema),
  updateArea
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole([Role.admin]),
  deleteArea
);

export default router;
