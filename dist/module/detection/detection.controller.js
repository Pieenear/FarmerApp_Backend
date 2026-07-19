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
import fs from "fs";
import path from "path";
import os from "os";
export const uploadImage = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { imageBase64, fileName } = req.body;
        if (!imageBase64) {
            res.status(400).json({ error: "Missing imageBase64 data." });
            return;
        }
        // Strip data URI prefix if it exists
        const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        // Get file extension or default to .jpg
        const extension = fileName ? path.extname(fileName) : ".jpg";
        const uniqueName = `img_${Date.now()}_${Math.round(Math.random() * 1e9)}${extension}`;
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, buffer);
        let serverUrl = process.env.BACKEND_URL;
        if (!serverUrl) {
            const protocol = req.headers["x-forwarded-proto"] || req.protocol;
            let host = req.get("host") || "localhost:5000";
            // If host is localhost/127.0.0.1, try to find local network IP
            if (host.includes("localhost") || host.includes("127.0.0.1")) {
                const interfaces = os.networkInterfaces();
                let localIp = "";
                for (const interfaceName in interfaces) {
                    const addresses = interfaces[interfaceName];
                    if (addresses) {
                        for (const addr of addresses) {
                            if (addr.family === "IPv4" && !addr.internal) {
                                localIp = addr.address;
                                break;
                            }
                        }
                    }
                    if (localIp)
                        break;
                }
                if (localIp) {
                    host = host.replace("localhost", localIp).replace("127.0.0.1", localIp);
                }
            }
            serverUrl = `${protocol}://${host}`;
        }
        const publicUrl = `${serverUrl}/uploads/${uniqueName}`;
        res.status(200).json({ imageUrl: publicUrl });
    }
    catch (error) {
        console.error("Upload image controller error:", error);
        res.status(500).json({ error: error.message || "Failed to upload image." });
    }
};
