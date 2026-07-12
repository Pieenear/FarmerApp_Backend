import { prisma } from "../../lib/prisma.js";
// ==========================================
// NOTIFICATION SERVICES
// ==========================================
export const getNotificationsService = async (userId) => {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};
export const markNotificationAsReadService = async (id, userId) => {
    const notification = await prisma.notification.findUnique({
        where: { id },
    });
    if (!notification) {
        throw new Error("Notification not found.");
    }
    if (notification.userId !== userId) {
        throw new Error("Unauthorized to access this notification.");
    }
    return await prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });
};
