import { Router } from "express";
import {
  createDetectionLog,
  listDetectionLogs,
  getDetectionLogById,
  updateDetectionLog,
  deleteDetectionLog,
  uploadImage,
} from "./detection.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createDetectionLogSchema, updateDetectionLogSchema } from "./detection.schema.js";

const router = Router();

// ==========================================
// DISEASE DETECTION LOG ROUTES
// ==========================================
router.post(
  "/upload",
  authMiddleware,
  uploadImage
);

router.post(
  "/logs",
  authMiddleware,
  validateRequest(createDetectionLogSchema),
  createDetectionLog
);

router.get(
  "/logs",
  authMiddleware,
  listDetectionLogs
);

router.get(
  "/logs/:id",
  authMiddleware,
  getDetectionLogById
);

router.patch(
  "/logs/:id",
  authMiddleware,
  validateRequest(updateDetectionLogSchema),
  updateDetectionLog
);

router.delete(
  "/logs/:id",
  authMiddleware,
  deleteDetectionLog
);

export default router;
