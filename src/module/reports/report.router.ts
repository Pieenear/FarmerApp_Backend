import { Router } from "express";
import {
  uploadReport,
  addSimplifiedReport,
  getReportList,
  getReportById,
} from "./report.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { uploadReportSchema, addSimplifiedReportSchema } from "./report.schema.js";
import { Role } from "../../generated/prisma/client.js";

const router = Router();

// Upload reports and add simplified notes (Admin only)
router.post(
  "/",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(uploadReportSchema),
  uploadReport
);

router.post(
  "/:id/simplify",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(addSimplifiedReportSchema),
  addSimplifiedReport
);

// Fetching reports list or details (Authenticated - secure checks inside service)
router.get("/", authMiddleware, getReportList);
router.get("/:id", authMiddleware, getReportById);

export default router;
