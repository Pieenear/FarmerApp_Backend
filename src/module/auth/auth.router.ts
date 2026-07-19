import { Router } from "express";
import { signupFarmer, signupAdmin, login, getMe, updateProfile, getUsers, verifyUser } from "./auth.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { farmerSignupSchema, adminSignupSchema, loginSchema } from "./auth.schema.js";
import { Role } from "../../generated/prisma/client.js";

const router = Router();

// Public routes with validation middleware
router.post("/signup/farmer", validateRequest(farmerSignupSchema), signupFarmer);
router.post("/signup/admin", validateRequest(adminSignupSchema), signupAdmin);
router.post("/login", validateRequest(loginSchema), login);

// Protected routes
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);

// Admin user management routes
router.get("/users", authMiddleware, requireRole([Role.admin]), getUsers);
router.patch("/users/:id/verify", authMiddleware, requireRole([Role.admin]), verifyUser);

export default router;
