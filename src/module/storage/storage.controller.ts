import { Request, Response } from "express";
import {
  createStorageUnitService,
  listStorageUnitsService,
  getStorageUnitByIdService,
  updateStorageUnitService,
  deleteStorageUnitService,
  createAllocationService,
  updateAllocationStatusService,
} from "./storage.service.js";

// ==========================================
// 1. STORAGE UNIT CONTROLLERS
// ==========================================

export const createStorageUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const unit = await createStorageUnitService(req.body);
    res.status(201).json({ message: "Storage Unit created successfully.", unit });
  } catch (error: any) {
    console.error("Create storage unit error:", error);
    res.status(400).json({ error: error.message || "Failed to create storage unit." });
  }
};

export const listStorageUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { areaId } = req.query;
    const units = await listStorageUnitsService(areaId ? BigInt(areaId as string) : undefined);
    res.status(200).json({ units });
  } catch (error: any) {
    console.error("List storage units error:", error);
    res.status(500).json({ error: "Failed to retrieve storage units." });
  }
};

export const getStorageUnitById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid storage unit ID format." });
      return;
    }

    const unit = await getStorageUnitByIdService(BigInt(id));
    res.status(200).json({ unit });
  } catch (error: any) {
    console.error("Get storage unit error:", error);
    res.status(404).json({ error: error.message || "Storage Unit not found." });
  }
};

export const updateStorageUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid storage unit ID format." });
      return;
    }

    const unit = await updateStorageUnitService(BigInt(id), req.body);
    res.status(200).json({ message: "Storage Unit updated successfully.", unit });
  } catch (error: any) {
    console.error("Update storage unit error:", error);
    res.status(400).json({ error: error.message || "Failed to update storage unit." });
  }
};

export const deleteStorageUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid storage unit ID format." });
      return;
    }

    await deleteStorageUnitService(BigInt(id));
    res.status(200).json({ message: "Storage Unit deleted successfully." });
  } catch (error: any) {
    console.error("Delete storage unit error:", error);
    res.status(400).json({ error: error.message || "Failed to delete storage unit." });
  }
};

// ==========================================
// 2. STORAGE ALLOCATION CONTROLLERS (Admin only)
// ==========================================

export const createAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const allocation = await createAllocationService(req.body, BigInt(req.user.id));
    res.status(201).json({ message: "Storage space allocated successfully.", allocation });
  } catch (error: any) {
    console.error("Create storage allocation error:", error);
    res.status(400).json({ error: error.message || "Failed to allocate storage space." });
  }
};

export const updateAllocationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid allocation ID format." });
      return;
    }

    const allocation = await updateAllocationStatusService(BigInt(id), req.body, BigInt(req.user.id));
    res.status(200).json({ message: "Storage allocation status updated successfully.", allocation });
  } catch (error: any) {
    console.error("Update storage allocation status error:", error);
    res.status(400).json({ error: error.message || "Failed to update allocation status." });
  }
};
