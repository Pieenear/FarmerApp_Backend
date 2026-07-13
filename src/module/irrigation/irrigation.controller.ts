import { Request, Response } from "express";
import {
  createLightScheduleService,
  listLightSchedulesService,
  getLightScheduleByIdService,
  updateLightScheduleService,
  deleteLightScheduleService,
  createMcbContactService,
  listMcbContactsService,
  getMcbContactByIdService,
  updateMcbContactService,
  deleteMcbContactService,
  createRecommendationService,
  listRecommendationsService,
} from "./irrigation.service.js";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../generated/prisma/client.js";

// ==========================================
// 1. LIGHT SCHEDULE CONTROLLERS
// ==========================================

export const createLightSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const schedule = await createLightScheduleService(req.body, BigInt(req.user.id));
    res.status(201).json({ message: "Light schedule created successfully.", schedule });
  } catch (error: any) {
    console.error("Create light schedule error:", error);
    res.status(400).json({ error: error.message || "Failed to create light schedule." });
  }
};

export const listLightSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const { areaId } = req.query;

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(req.user.id) },
    });
    if (!dbUser) {
      res.status(401).json({ error: "User profile not found." });
      return;
    }

    let targetAreaId = areaId ? BigInt(areaId as string) : undefined;

    // Enforce area restriction for Farmers
    if (dbUser.role === Role.farmer) {
      if (dbUser.areaId) {
        targetAreaId = dbUser.areaId;
      } else {
        res.status(200).json({ schedules: [] });
        return;
      }
    }

    const schedules = await listLightSchedulesService({ areaId: targetAreaId });
    res.status(200).json({ schedules });
  } catch (error: any) {
    console.error("List light schedules error:", error);
    res.status(500).json({ error: "Failed to retrieve light schedules." });
  }
};

export const getLightScheduleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid schedule ID format." });
      return;
    }

    const schedule = await getLightScheduleByIdService(BigInt(id));
    res.status(200).json({ schedule });
  } catch (error: any) {
    console.error("Get light schedule error:", error);
    res.status(404).json({ error: error.message || "Light schedule not found." });
  }
};

export const updateLightSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid schedule ID format." });
      return;
    }

    const schedule = await updateLightScheduleService(BigInt(id), req.body);
    res.status(200).json({ message: "Light schedule updated successfully.", schedule });
  } catch (error: any) {
    console.error("Update light schedule error:", error);
    res.status(400).json({ error: error.message || "Failed to update light schedule." });
  }
};

export const deleteLightSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid schedule ID format." });
      return;
    }

    await deleteLightScheduleService(BigInt(id));
    res.status(200).json({ message: "Light schedule deleted successfully." });
  } catch (error: any) {
    console.error("Delete light schedule error:", error);
    res.status(400).json({ error: error.message || "Failed to delete light schedule." });
  }
};

// ==========================================
// 2. MCB UTILITY CONTACT CONTROLLERS
// ==========================================

export const createMcbContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const contact = await createMcbContactService(req.body);
    res.status(201).json({ message: "MCB contact created successfully.", contact });
  } catch (error: any) {
    console.error("Create MCB contact error:", error);
    res.status(400).json({ error: error.message || "Failed to create MCB contact." });
  }
};

export const listMcbContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const { areaId } = req.query;

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(req.user.id) },
    });
    if (!dbUser) {
      res.status(401).json({ error: "User profile not found." });
      return;
    }

    let targetAreaId = areaId ? BigInt(areaId as string) : undefined;

    // Enforce area restriction for Farmers
    if (dbUser.role === Role.farmer) {
      if (dbUser.areaId) {
        targetAreaId = dbUser.areaId;
      } else {
        res.status(200).json({ contacts: [] });
        return;
      }
    }

    const contacts = await listMcbContactsService({ areaId: targetAreaId });
    res.status(200).json({ contacts });
  } catch (error: any) {
    console.error("List MCB contacts error:", error);
    res.status(500).json({ error: "Failed to retrieve MCB contacts." });
  }
};

export const getMcbContactById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid contact ID format." });
      return;
    }

    const contact = await getMcbContactByIdService(BigInt(id));
    res.status(200).json({ contact });
  } catch (error: any) {
    console.error("Get MCB contact error:", error);
    res.status(404).json({ error: error.message || "MCB contact not found." });
  }
};

export const updateMcbContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid contact ID format." });
      return;
    }

    const contact = await updateMcbContactService(BigInt(id), req.body);
    res.status(200).json({ message: "MCB contact updated successfully.", contact });
  } catch (error: any) {
    console.error("Update MCB contact error:", error);
    res.status(400).json({ error: error.message || "Failed to update MCB contact." });
  }
};

export const deleteMcbContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid contact ID format." });
      return;
    }

    await deleteMcbContactService(BigInt(id));
    res.status(200).json({ message: "MCB contact deleted successfully." });
  } catch (error: any) {
    console.error("Delete MCB contact error:", error);
    res.status(400).json({ error: error.message || "Failed to delete MCB contact." });
  }
};

// ==========================================
// 3. IRRIGATION RECOMMENDATION CONTROLLERS
// ==========================================

export const createRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const recommendation = await createRecommendationService(req.body);
    res.status(201).json({ message: "Irrigation recommendation created successfully.", recommendation });
  } catch (error: any) {
    console.error("Create irrigation recommendation error:", error);
    res.status(400).json({ error: error.message || "Failed to create recommendation." });
  }
};

export const listRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const { farmerId } = req.query;

    const recommendations = await listRecommendationsService({
      role: req.user.role as Role,
      requesterId: BigInt(req.user.id),
      farmerId: farmerId ? BigInt(farmerId as string) : undefined,
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(req.user.id) },
    });
    const lang = dbUser?.languagePref || (req.headers["accept-language"]?.includes("mr") ? "mr" : "en");

    const localizedRecommendations = recommendations.map((rec) => {
      let localizedMsg = rec.recommendationText;
      if (rec.recommendationText) {
        try {
          const parsed = JSON.parse(rec.recommendationText);
          if (parsed && typeof parsed === "object") {
            localizedMsg = parsed[lang] || parsed.en || rec.recommendationText;
          }
        } catch (e) {
          // fallback
        }
      }
      return {
        ...rec,
        recommendationText: localizedMsg,
      };
    });

    res.status(200).json({ recommendations: localizedRecommendations });
  } catch (error: any) {
    console.error("List recommendations error:", error);
    res.status(500).json({ error: "Failed to retrieve recommendations." });
  }
};
