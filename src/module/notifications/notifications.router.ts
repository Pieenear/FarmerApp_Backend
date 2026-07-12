import { Router } from "express";
import { getNotifications, markNotificationAsRead } from "./notifications.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// ==========================================
// NOTIFICATION ROUTES
// ==========================================
router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markNotificationAsRead);

export default router;
