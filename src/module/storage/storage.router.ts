import { Router } from "express";
import {
  createStorageUnit,
  listStorageUnits,
  getStorageUnitById,
  updateStorageUnit,
  deleteStorageUnit,
  createAllocation,
  updateAllocationStatus,
} from "./storage.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import {
  createStorageUnitSchema,
  updateStorageUnitSchema,
  createAllocationSchema,
  updateAllocationStatusSchema,
} from "./storage.schema.js";
import { Role } from "../../generated/prisma/client.js";

const router = Router();

// ==========================================
// 1. STORAGE UNIT ROUTES (Admin/Authenticated)
// ==========================================
router.post(
  "/units",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(createStorageUnitSchema),
  createStorageUnit
);

router.get(
  "/units",
  authMiddleware,
  listStorageUnits
);

router.get(
  "/units/:id",
  authMiddleware,
  getStorageUnitById
);

router.patch(
  "/units/:id",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(updateStorageUnitSchema),
  updateStorageUnit
);

router.delete(
  "/units/:id",
  authMiddleware,
  requireRole([Role.admin]),
  deleteStorageUnit
);

// ==========================================
// 2. STORAGE ALLOCATION ROUTES (Admin only)
// ==========================================
router.post(
  "/allocations",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(createAllocationSchema),
  createAllocation
);

router.patch(
  "/allocations/:id/status",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(updateAllocationStatusSchema),
  updateAllocationStatus
);

export default router;
