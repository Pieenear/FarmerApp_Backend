import { Request, Response } from "express";
import { createAreaService, getAreasService, getAreaByIdService, updateAreaService, deleteAreaService } from "./area.service.js";

export const createArea = async (req: Request, res: Response): Promise<void> => {
  try {
    const area = await createAreaService(req.body);
    res.status(201).json({
      message: "Area created successfully.",
      area,
    });
  } catch (error: any) {
    console.error("Create area controller error:", error);
    res.status(400).json({ error: error.message || "Failed to create area." });
  }
};


export const getAreas = async (req: Request, res: Response): Promise<void> => {
  try {
    const areas = await getAreasService();
    res.status(200).json({ areas });
  } catch (error: any) {
    console.error("Get areas controller error:", error);
    res.status(500).json({ error: "Failed to retrieve areas." });
  }
};

export const getAreaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid area ID format." });
      return;
    }

    const area = await getAreaByIdService(BigInt(id));
    res.status(200).json({ area });
  } catch (error: any) {
    console.error("Get area by id controller error:", error);
    res.status(404).json({ error: error.message || "Area not found." });
  }
};

export const updateArea = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const areaId = Array.isArray(id) ? id[0] : id;
    if (!areaId) {
      res.status(400).json({ error: "Area ID is required." });
      return;
    }
    const area = await updateAreaService(BigInt(areaId), req.body);
    res.status(200).json({ message: "Area updated successfully.", area });
  } catch (error: any) {
    console.error("Update area error:", error);
    res.status(400).json({ error: error.message || "Failed to update area." });
  }
};

export const deleteArea = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const areaId = Array.isArray(id) ? id[0] : id;
    if (!areaId) {
      res.status(400).json({ error: "Area ID is required." });
      return;
    }
    await deleteAreaService(BigInt(areaId));
    res.status(200).json({ message: "Area deleted successfully." });
  } catch (error: any) {
    console.error("Delete area error:", error);
    res.status(400).json({ error: error.message || "Failed to delete area." });
  }
};
