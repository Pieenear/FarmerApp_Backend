import { getNotificationsService, markNotificationAsReadService } from "./notifications.service.js";
// ==========================================
// NOTIFICATION CONTROLLERS
// ==========================================
export const getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const notifications = await getNotificationsService(BigInt(req.user.id));
        res.status(200).json({ notifications });
    }
    catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ error: "Failed to retrieve notifications." });
    }
};
export const markNotificationAsRead = async (req, res) => {
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
    }
    catch (error) {
        console.error("Mark notification read error:", error);
        res.status(400).json({ error: error.message || "Failed to update notification." });
    }
};
