import { Router } from "express";
import {
  createStaff,
  getStaffList,
  getStaffById,
  updateStaff,
  deleteStaff,
  assignRequestToStaff,
} from "./staff.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createStaffSchema, updateStaffSchema, assignRequestSchema } from "./staff.schema.js";
import { Role } from "../../generated/prisma/client.js";

const router = Router();

// Staff assignment route (Admin only)
router.post(
  "/assign",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(assignRequestSchema),
  assignRequestToStaff
);

// CRUD routes (Create, Update, Delete are Admin only; Read is Authenticated)
router.post(
  "/",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(createStaffSchema),
  createStaff
);

router.get("/", authMiddleware, getStaffList);
router.get("/:id", authMiddleware, getStaffById);

router.patch(
  "/:id",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(updateStaffSchema),
  updateStaff
);

router.delete("/:id", authMiddleware, requireRole([Role.admin]), deleteStaff);

export default router;
