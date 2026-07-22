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
(BigInt.prototype as any).toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

import path from "path";
import fs from "fs";

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = frontendUrl
  ? frontendUrl.split(",").map(url => url.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      // If no origins configured, or wildcard, dynamically allow & mirror the origin to satisfy credentials: true
      if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      
      // Check if matches allowed origins, localhost, or local IP ranges (for mobile testing)
      const isAllowed = allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/uploads", express.static(uploadsDir));

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
