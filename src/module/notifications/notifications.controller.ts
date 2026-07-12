import { Request, Response } from "express";
import { getNotificationsService, markNotificationAsReadService } from "./notifications.service.js";

// ==========================================
// NOTIFICATION CONTROLLERS
// ==========================================

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const notifications = await getNotificationsService(BigInt(req.user.id));
    res.status(200).json({ notifications });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to retrieve notifications." });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid notification ID format." });
      return;
    }
    const notification = await markNotificationAsReadService(BigInt(id), BigInt(req.user.id));
    res.status(200).json({ message: "Notification marked as read.", notification });
  } catch (error: any) {
    console.error("Mark notification read error:", error);
    res.status(400).json({ error: error.message || "Failed to update notification." });
  }
};
