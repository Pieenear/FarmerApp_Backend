import { Router } from "express";
import { signupFarmer, signupAdmin, login, getMe, updateProfile } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { farmerSignupSchema, adminSignupSchema, loginSchema } from "./auth.schema.js";

const router = Router();

// Public routes with validation middleware
router.post("/signup/farmer", validateRequest(farmerSignupSchema), signupFarmer);
router.post("/signup/admin", validateRequest(adminSignupSchema), signupAdmin);
router.post("/login", validateRequest(loginSchema), login);

// Protected routes
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);

export default router;
