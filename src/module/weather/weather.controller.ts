import { Request, Response } from "express";
import {
  createWeatherAlertService,
  listWeatherAlertsService,
  getWeatherAlertByIdService,
  updateWeatherAlertService,
  deleteWeatherAlertService,
} from "./weather.service.js";
import { prisma } from "../../lib/prisma.js";
import { Role, Severity } from "../../generated/prisma/client.js";

// ==========================================
// WEATHER ALERT CONTROLLERS
// ==========================================

export const createWeatherAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const alert = await createWeatherAlertService(req.body);
    res.status(201).json({ message: "Weather alert broadcasted successfully.", alert });
  } catch (error: any) {
    console.error("Create weather alert error:", error);
    res.status(400).json({ error: error.message || "Failed to create weather alert." });
  }
};

export const listWeatherAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const { areaId, severity, activeOnly } = req.query;

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(req.user.id) },
    });

    let targetAreaId = areaId ? BigInt(areaId as string) : undefined;

    // Enforce area restriction for Farmers (they can only view alerts for their own area)
    if (dbUser && dbUser.role === Role.farmer) {
      if (dbUser.areaId) {
        targetAreaId = dbUser.areaId;
      } else {
        res.status(200).json({ alerts: [] });
        return;
      }
    }

    const alerts = await listWeatherAlertsService({
      areaId: targetAreaId,
      severity: severity as Severity | undefined,
      activeOnly: activeOnly === "true",
    });

    const lang = dbUser?.languagePref || (req.headers["accept-language"]?.includes("mr") ? "mr" : "en");
    const localizedAlerts = alerts.map((alert) => {
      let localizedMsg = alert.message;
      if (alert.message) {
        try {
          const parsed = JSON.parse(alert.message);
          if (parsed && typeof parsed === "object") {
            localizedMsg = parsed[lang] || parsed.en || alert.message;
          }
        } catch (e) {
          // fallback
        }
      }
      return {
        ...alert,
        message: localizedMsg,
      };
    });

    res.status(200).json({ alerts: localizedAlerts });
  } catch (error: any) {
    console.error("List weather alerts error:", error);
    res.status(500).json({ error: "Failed to retrieve weather alerts." });
  }
};

export const getWeatherAlertById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid alert ID format." });
      return;
    }

    const alert = await getWeatherAlertByIdService(BigInt(id));

    const dbUser = req.user
      ? await prisma.user.findUnique({ where: { id: BigInt(req.user.id) } })
      : null;
    const lang = dbUser?.languagePref || (req.headers["accept-language"]?.includes("mr") ? "mr" : "en");

    let localizedMsg = alert.message;
    if (alert.message) {
      try {
        const parsed = JSON.parse(alert.message);
        if (parsed && typeof parsed === "object") {
          localizedMsg = parsed[lang] || parsed.en || alert.message;
        }
      } catch (e) {
        // fallback
      }
    }

    res.status(200).json({
      alert: {
        ...alert,
        message: localizedMsg,
      },
    });
  } catch (error: any) {
    console.error("Get weather alert error:", error);
    res.status(404).json({ error: error.message || "Weather alert not found." });
  }
};

export const updateWeatherAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid alert ID format." });
      return;
    }

    const alert = await updateWeatherAlertService(BigInt(id), req.body);
    res.status(200).json({ message: "Weather alert updated successfully.", alert });
  } catch (error: any) {
    console.error("Update weather alert error:", error);
    res.status(400).json({ error: error.message || "Failed to update weather alert." });
  }
};

export const deleteWeatherAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid alert ID format." });
      return;
    }

    await deleteWeatherAlertService(BigInt(id));
    res.status(200).json({ message: "Weather alert deleted successfully." });
  } catch (error: any) {
    console.error("Delete weather alert error:", error);
    res.status(400).json({ error: error.message || "Failed to delete weather alert." });
  }
};
