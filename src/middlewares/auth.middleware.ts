import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthJwtPayload } from "../@types/auth.js";
import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/client.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthJwtPayload;

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.id) },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid token. User not found." });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Access denied. User account is deactivated." });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireRole = (roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized. Please authenticate." });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: BigInt(req.user.id) },
      });

      if (!user) {
        res.status(401).json({ error: "User not found." });
        return;
      }

      if (!roles.includes(user.role)) {
        res.status(403).json({ error: "Forbidden. Insufficient permissions." });
        return;
      }

      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      res.status(500).json({ error: "Internal server error during authorization." });
    }
  };
};
