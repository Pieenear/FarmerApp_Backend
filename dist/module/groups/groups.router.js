import { Router } from "express";
import { createGroup, listGroups, joinGroup, leaveGroup, listGroupMembers, deleteGroup, } from "./groups.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createGroupSchema } from "./groups.schema.js";
const router = Router();
// ==========================================
// FARMER GROUPS ROUTES
// ==========================================
router.post("/", authMiddleware, validateRequest(createGroupSchema), createGroup);
router.get("/", authMiddleware, listGroups);
router.post("/:id/join", authMiddleware, joinGroup);
router.post("/:id/leave", authMiddleware, leaveGroup);
router.get("/:id/members", authMiddleware, listGroupMembers);
router.delete("/:id", authMiddleware, deleteGroup);
export default router;
