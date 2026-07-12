import "dotenv/config.js";
import express from "express";
import cors from "cors";
import { connectDB } from "./lib/prisma.js";
import authRoutes from "./module/auth/auth.router.js";
import areaRoutes from "./module/areas/area.router.js";
import requestRoutes from "./module/requests/request.router.js";
import staffRoutes from "./module/staff/staff.router.js";
import reportRoutes from "./module/reports/report.router.js";
import marketplaceRoutes from "./module/marketplace/marketplace.router.js";
import storageRoutes from "./module/storage/storage.router.js";
import weatherRoutes from "./module/weather/weather.router.js";
import contentRoutes from "./module/content/content.router.js";
import irrigationRoutes from "./module/irrigation/irrigation.router.js";
import detectionRoutes from "./module/detection/detection.router.js";
import notificationsRoutes from "./module/notifications/notifications.router.js";
import groupsRoutes from "./module/groups/groups.router.js";
// Global BigInt serialization patch for Express/JSON
BigInt.prototype.toJSON = function () {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
};
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
const frontendUrl = process.env.FRONTEND_URL;
app.use(cors({
    origin: frontendUrl ? frontendUrl.split(",").map(url => url.trim()) : "*",
    credentials: true,
}));
app.use(express.json());
// Request logger (basic)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/irrigation", irrigationRoutes);
app.use("/api/detection", detectionRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/groups", groupsRoutes);
// Base route / Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Farmer App API is running smoothly." });
});
// Fallback Route for 404
app.use((req, res) => {
    res.status(404).json({ error: "API Route not found" });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "Something went wrong on the server." });
});
// Start Server
async function start() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}
start();
