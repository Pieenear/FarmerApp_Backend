import { Router } from "express";
import { createWeatherAlert, listWeatherAlerts, getWeatherAlertById, updateWeatherAlert, deleteWeatherAlert, } from "./weather.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import { createWeatherAlertSchema, updateWeatherAlertSchema } from "./weather.schema.js";
import { Role } from "../../generated/prisma/client.js";
const router = Router();
// ==========================================
// WEATHER ALERT ROUTES
// ==========================================
router.post("/alerts", authMiddleware, requireRole([Role.admin]), validateRequest(createWeatherAlertSchema), createWeatherAlert);
router.get("/alerts", authMiddleware, listWeatherAlerts);
router.get("/alerts/:id", authMiddleware, getWeatherAlertById);
router.patch("/alerts/:id", authMiddleware, requireRole([Role.admin]), validateRequest(updateWeatherAlertSchema), updateWeatherAlert);
router.delete("/alerts/:id", authMiddleware, requireRole([Role.admin]), deleteWeatherAlert);
export default router;
