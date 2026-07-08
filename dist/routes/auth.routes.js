import { Router } from "express";
import { signupFarmer, signupAdmin, login, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();
// Public routes
router.post("/signup/farmer", signupFarmer);
router.post("/signup/admin", signupAdmin);
router.post("/login", login);
// Private routes
router.get("/me", authMiddleware, getMe);
export default router;
