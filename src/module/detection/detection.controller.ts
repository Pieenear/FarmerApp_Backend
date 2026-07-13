import { Request, Response } from "express";
import {
  createDetectionLogService,
  listDetectionLogsService,
  getDetectionLogByIdService,
  updateDetectionLogService,
  deleteDetectionLogService,
} from "./detection.service.js";

// ==========================================
// DISEASE DETECTION LOG CONTROLLERS
// ==========================================

export const createDetectionLog = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const log = await createDetectionLogService(
      req.body,
      BigInt(req.user.id)
    );
    res.status(201).json({ message: "Disease detection log created successfully.", log });
  } catch (error: any) {
    console.error("Create detection log error:", error);
    res.status(400).json({ error: error.message || "Failed to create detection log." });
  }
};

export const listDetectionLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const { farmerId, cropType, detectedDisease } = req.query;

    const logs = await listDetectionLogsService({
      requesterId: BigInt(req.user.id),
      farmerId: farmerId ? BigInt(farmerId as string) : undefined,
      cropType: cropType as string | undefined,
      detectedDisease: detectedDisease as string | undefined,
    });

    res.status(200).json({ logs });
  } catch (error: any) {
    console.error("List detection logs error:", error);
    res.status(500).json({ error: "Failed to retrieve detection logs." });
  }
};

export const getDetectionLogById = async (req: Request, res: Response): Promise<void> => {
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

    const log = await getDetectionLogByIdService(
      BigInt(id),
      BigInt(req.user.id)
    );
    res.status(200).json({ log });
  } catch (error: any) {
    console.error("Get detection log error:", error);
    res.status(404).json({ error: error.message || "Detection log not found." });
  }
};

export const updateDetectionLog = async (req: Request, res: Response): Promise<void> => {
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

    const log = await updateDetectionLogService(
      BigInt(id),
      req.body,
      BigInt(req.user.id)
    );
    res.status(200).json({ message: "Detection log updated successfully.", log });
  } catch (error: any) {
    console.error("Update detection log error:", error);
    res.status(400).json({ error: error.message || "Failed to update detection log." });
  }
};

export const deleteDetectionLog = async (req: Request, res: Response): Promise<void> => {
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

    await deleteDetectionLogService(
      BigInt(id),
      BigInt(req.user.id)
    );
    res.status(200).json({ message: "Detection log deleted successfully." });
  } catch (error: any) {
    console.error("Delete detection log error:", error);
    res.status(400).json({ error: error.message || "Failed to delete detection log." });
  }
};

import fs from "fs";
import path from "path";

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
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
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
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

    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.get("host");
    const publicUrl = `${protocol}://${host}/uploads/${uniqueName}`;

    res.status(200).json({ imageUrl: publicUrl });
  } catch (error: any) {
    console.error("Upload image controller error:", error);
    res.status(500).json({ error: error.message || "Failed to upload image." });
  }
};
