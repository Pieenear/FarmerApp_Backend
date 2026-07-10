import { createWeatherAlertService, listWeatherAlertsService, getWeatherAlertByIdService, updateWeatherAlertService, deleteWeatherAlertService, } from "./weather.service.js";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../generated/prisma/client.js";
// ==========================================
// WEATHER ALERT CONTROLLERS
// ==========================================
export const createWeatherAlert = async (req, res) => {
    try {
        const alert = await createWeatherAlertService(req.body);
        res.status(201).json({ message: "Weather alert broadcasted successfully.", alert });
    }
    catch (error) {
        console.error("Create weather alert error:", error);
        res.status(400).json({ error: error.message || "Failed to create weather alert." });
    }
};
export const listWeatherAlerts = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { areaId, severity, activeOnly } = req.query;
        const dbUser = await prisma.user.findUnique({
            where: { id: BigInt(req.user.id) },
        });
        let targetAreaId = areaId ? BigInt(areaId) : undefined;
        // Enforce area restriction for Farmers (they can only view alerts for their own area)
        if (dbUser && dbUser.role === Role.farmer) {
            if (dbUser.areaId) {
                targetAreaId = dbUser.areaId;
            }
            else {
                res.status(200).json({ alerts: [] });
                return;
            }
        }
        const alerts = await listWeatherAlertsService({
            areaId: targetAreaId,
            severity: severity,
            activeOnly: activeOnly === "true",
        });
        res.status(200).json({ alerts });
    }
    catch (error) {
        console.error("List weather alerts error:", error);
        res.status(500).json({ error: "Failed to retrieve weather alerts." });
    }
};
export const getWeatherAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid alert ID format." });
            return;
        }
        const alert = await getWeatherAlertByIdService(BigInt(id));
        res.status(200).json({ alert });
    }
    catch (error) {
        console.error("Get weather alert error:", error);
        res.status(404).json({ error: error.message || "Weather alert not found." });
    }
};
export const updateWeatherAlert = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid alert ID format." });
            return;
        }
        const alert = await updateWeatherAlertService(BigInt(id), req.body);
        res.status(200).json({ message: "Weather alert updated successfully.", alert });
    }
    catch (error) {
        console.error("Update weather alert error:", error);
        res.status(400).json({ error: error.message || "Failed to update weather alert." });
    }
};
export const deleteWeatherAlert = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid alert ID format." });
            return;
        }
        await deleteWeatherAlertService(BigInt(id));
        res.status(200).json({ message: "Weather alert deleted successfully." });
    }
    catch (error) {
        console.error("Delete weather alert error:", error);
        res.status(400).json({ error: error.message || "Failed to delete weather alert." });
    }
};
