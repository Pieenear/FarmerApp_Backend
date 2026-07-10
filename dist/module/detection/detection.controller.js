import { createDetectionLogService, listDetectionLogsService, getDetectionLogByIdService, updateDetectionLogService, deleteDetectionLogService, } from "./detection.service.js";
// ==========================================
// DISEASE DETECTION LOG CONTROLLERS
// ==========================================
export const createDetectionLog = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const log = await createDetectionLogService(req.body, BigInt(req.user.id));
        res.status(201).json({ message: "Disease detection log created successfully.", log });
    }
    catch (error) {
        console.error("Create detection log error:", error);
        res.status(400).json({ error: error.message || "Failed to create detection log." });
    }
};
export const listDetectionLogs = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { farmerId, cropType, detectedDisease } = req.query;
        const logs = await listDetectionLogsService({
            requesterId: BigInt(req.user.id),
            farmerId: farmerId ? BigInt(farmerId) : undefined,
            cropType: cropType,
            detectedDisease: detectedDisease,
        });
        res.status(200).json({ logs });
    }
    catch (error) {
        console.error("List detection logs error:", error);
        res.status(500).json({ error: "Failed to retrieve detection logs." });
    }
};
export const getDetectionLogById = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid log ID format." });
            return;
        }
        const log = await getDetectionLogByIdService(BigInt(id), BigInt(req.user.id));
        res.status(200).json({ log });
    }
    catch (error) {
        console.error("Get detection log error:", error);
        res.status(404).json({ error: error.message || "Detection log not found." });
    }
};
export const updateDetectionLog = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid log ID format." });
            return;
        }
        const log = await updateDetectionLogService(BigInt(id), req.body, BigInt(req.user.id));
        res.status(200).json({ message: "Detection log updated successfully.", log });
    }
    catch (error) {
        console.error("Update detection log error:", error);
        res.status(400).json({ error: error.message || "Failed to update detection log." });
    }
};
export const deleteDetectionLog = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid log ID format." });
            return;
        }
        await deleteDetectionLogService(BigInt(id), BigInt(req.user.id));
        res.status(200).json({ message: "Detection log deleted successfully." });
    }
    catch (error) {
        console.error("Delete detection log error:", error);
        res.status(400).json({ error: error.message || "Failed to delete detection log." });
    }
};
