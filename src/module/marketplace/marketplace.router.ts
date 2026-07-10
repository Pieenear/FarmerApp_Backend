import { Router } from "express";
import {
  createBuyer,
  listBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
  listCropListings,
  getCropListingById,
  updateCropListing,
  createBuyerMatch,
  updateMatchStatus,
} from "./marketplace.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import {
  createBuyerSchema,
  updateBuyerSchema,
  createMatchSchema,
  updateMatchStatusSchema,
  updateListingSchema,
} from "./marketplace.schema.js";
import { Role } from "../../generated/prisma/client.js";

const router = Router();

// ==========================================
// 1. BUYER ROUTES (Admin only)
// ==========================================
router.post(
  "/buyers",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(createBuyerSchema),
  createBuyer
);

router.get(
  "/buyers",
  authMiddleware,
  requireRole([Role.admin]),
  listBuyers
);

router.get(
  "/buyers/:id",
  authMiddleware,
  requireRole([Role.admin]),
  getBuyerById
);

router.patch(
  "/buyers/:id",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(updateBuyerSchema),
  updateBuyer
);

router.delete(
  "/buyers/:id",
  authMiddleware,
  requireRole([Role.admin]),
  deleteBuyer
);

// ==========================================
// 2. CROP LISTING ROUTES (Authenticated)
// ==========================================
router.get(
  "/listings",
  authMiddleware,
  listCropListings
);

router.get(
  "/listings/:id",
  authMiddleware,
  getCropListingById
);

router.patch(
  "/listings/:id",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(updateListingSchema),
  updateCropListing
);

// ==========================================
// 3. MATCHMAKING ROUTES (Admin only)
// ==========================================
router.post(
  "/matches",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(createMatchSchema),
  createBuyerMatch
);

router.patch(
  "/matches/:id/status",
  authMiddleware,
  requireRole([Role.admin]),
  validateRequest(updateMatchStatusSchema),
  updateMatchStatus
);

export default router;
