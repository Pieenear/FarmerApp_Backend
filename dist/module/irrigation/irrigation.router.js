import { Router } from "express";
import { createLightSchedule, listLightSchedules, getLightScheduleById, updateLightSchedule, deleteLightSchedule, createMcbContact, listMcbContacts, getMcbContactById, updateMcbContact, deleteMcbContact, } from "./irrigation.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createLightScheduleSchema, updateLightScheduleSchema, createMcbContactSchema, updateMcbContactSchema, } from "./irrigation.schema.js";
import { Role } from "../../generated/prisma/client.js";
const router = Router();
// ==========================================
// 1. LIGHT SCHEDULE ROUTES
// ==========================================
router.post("/schedules", authMiddleware, requireRole([Role.admin]), validateRequest(createLightScheduleSchema), createLightSchedule);
router.get("/schedules", authMiddleware, listLightSchedules);
router.get("/schedules/:id", authMiddleware, getLightScheduleById);
router.patch("/schedules/:id", authMiddleware, requireRole([Role.admin]), validateRequest(updateLightScheduleSchema), updateLightSchedule);
router.delete("/schedules/:id", authMiddleware, requireRole([Role.admin]), deleteLightSchedule);
// ==========================================
// 2. MCB CONTACT ROUTES
// ==========================================
router.post("/contacts", authMiddleware, requireRole([Role.admin]), validateRequest(createMcbContactSchema), createMcbContact);
router.get("/contacts", authMiddleware, listMcbContacts);
router.get("/contacts/:id", authMiddleware, getMcbContactById);
router.patch("/contacts/:id", authMiddleware, requireRole([Role.admin]), validateRequest(updateMcbContactSchema), updateMcbContact);
router.delete("/contacts/:id", authMiddleware, requireRole([Role.admin]), deleteMcbContact);
export default router;
