import { Router } from "express";
import { raiseRequest, getRequests, getRequestById, updateRequestStatus, } from "./request.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { raiseRequestSchema, updateRequestStatusSchema } from "./request.schema.js";
import { Role } from "../../generated/prisma/client.js";
const router = Router();
// 1. Raise request (Farmer only)
router.post("/", authMiddleware, requireRole([Role.farmer]), validateRequest(raiseRequestSchema), raiseRequest);
// 2. Get list of requests (Farmers see their own, Admins see all)
router.get("/", authMiddleware, getRequests);
// 3. Get specific request details
router.get("/:id", authMiddleware, getRequestById);
// 4. Update request status (Admin only)
router.patch("/:id/status", authMiddleware, requireRole([Role.admin]), validateRequest(updateRequestStatusSchema), updateRequestStatus);
export default router;
