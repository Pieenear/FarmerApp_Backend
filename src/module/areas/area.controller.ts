import { Request, Response } from "express";
import { createAreaService, getAreasService, getAreaByIdService } from "./area.service.js";

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
