import { Router } from "express";
import { createContent, listContent, getContentById, updateContent, deleteContent, } from "./content.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createContentSchema, updateContentSchema } from "./content.schema.js";
import { Role } from "../../generated/prisma/client.js";
const router = Router();
// ==========================================
// AGRI CONTENT ROUTES
// ==========================================
router.post("/", authMiddleware, requireRole([Role.admin]), validateRequest(createContentSchema), createContent);
router.get("/", authMiddleware, listContent);
router.get("/:id", authMiddleware, getContentById);
router.patch("/:id", authMiddleware, requireRole([Role.admin]), validateRequest(updateContentSchema), updateContent);
router.delete("/:id", authMiddleware, requireRole([Role.admin]), deleteContent);
export default router;
