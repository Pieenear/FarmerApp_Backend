import { Request, Response } from "express";
import {
  uploadReportService,
  addSimplifiedReportService,
  getReportListService,
  getReportByIdService,
} from "./report.service.js";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../generated/prisma/client.js";

/**
 * Helper to fetch database user role
 */
const getUserRole = async (userId: number): Promise<Role | null> => {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
  });
  return user ? user.role : null;
};

/**
 * @route   POST /api/reports
 * @desc    Upload a raw Lab Report (and optional simplified report) (Admin only)
 * @access  Private (Admin)
 */
export const uploadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const report = await uploadReportService(req.body, BigInt(req.user.id));
    res.status(201).json({
      message: "Lab report uploaded successfully and request marked as completed.",
      report,
    });
  } catch (error: any) {
    console.error("Upload report controller error:", error);
    res.status(400).json({ error: error.message || "Failed to upload lab report." });
  }
};

/**
 * @route   POST /api/reports/:id/simplify
 * @desc    Add or update a simplified explanation for a Lab Report (Admin only)
 * @access  Private (Admin)
 */
export const addSimplifiedReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid lab report ID format." });
      return;
    }

    const simplified = await addSimplifiedReportService(BigInt(id), req.body);
    res.status(200).json({
      message: "Simplified report updated successfully.",
      simplified,
    });
  } catch (error: any) {
    console.error("Add simplified report controller error:", error);
    res.status(400).json({ error: error.message || "Failed to save simplified report." });
  }
};

/**
 * @route   GET /api/reports
 * @desc    Get all lab reports (Farmers see only their own requests' reports; Admins see all)
 * @access  Private
 */
export const getReportList = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const role = await getUserRole(req.user.id);
    if (!role) {
      res.status(401).json({ error: "User role not found." });
      return;
    }

    const reports = await getReportListService(BigInt(req.user.id), role);
    res.status(200).json({ reports });
  } catch (error: any) {
    console.error("Get report list controller error:", error);
    res.status(500).json({ error: "Failed to retrieve reports list." });
  }
};

/**
 * @route   GET /api/reports/:id
 * @desc    Get specific Lab Report by ID with nested simplified details
 * @access  Private (Farmer / Admin)
 */
export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid report ID format." });
      return;
    }

    const role = await getUserRole(req.user.id);
    if (!role) {
      res.status(401).json({ error: "User role not found." });
      return;
    }

    const report = await getReportByIdService(BigInt(id), BigInt(req.user.id), role);
    res.status(200).json({ report });
  } catch (error: any) {
    console.error("Get report by ID controller error:", error);
    const status = error.message.includes("Unauthorized") ? 403 : 404;
    res.status(status).json({ error: error.message || "Report not found." });
  }
};
