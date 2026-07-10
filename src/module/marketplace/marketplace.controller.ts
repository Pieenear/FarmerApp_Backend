import { Request, Response } from "express";
import {
  createBuyerService,
  listBuyersService,
  getBuyerByIdService,
  updateBuyerService,
  deleteBuyerService,
  listCropListingsService,
  getCropListingByIdService,
  updateCropListingService,
  createBuyerMatchService,
  updateMatchStatusService,
} from "./marketplace.service.js";
import { prisma } from "../../lib/prisma.js";
import { Role, ListingStatus } from "../../generated/prisma/client.js";

/**
 * Helper to fetch database user role
 */
const getUserRole = async (userId: number): Promise<Role | null> => {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
  });
  return user ? user.role : null;
};

// ==========================================
// 1. BUYER CONTROLLERS (Admin only)
// ==========================================

export const createBuyer = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const buyer = await createBuyerService(req.body, BigInt(req.user.id));
    res.status(201).json({ message: "Buyer created successfully.", buyer });
  } catch (error: any) {
    console.error("Create buyer error:", error);
    res.status(400).json({ error: error.message || "Failed to create buyer." });
  }
};

export const listBuyers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, areaId } = req.query;
    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }
    if (areaId !== undefined) {
      filters.areaId = BigInt(areaId as string);
    }

    const buyers = await listBuyersService(filters);
    res.status(200).json({ buyers });
  } catch (error: any) {
    console.error("List buyers error:", error);
    res.status(500).json({ error: "Failed to retrieve buyers." });
  }
};

export const getBuyerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid buyer ID format." });
      return;
    }

    const buyer = await getBuyerByIdService(BigInt(id));
    res.status(200).json({ buyer });
  } catch (error: any) {
    console.error("Get buyer error:", error);
    res.status(404).json({ error: error.message || "Buyer not found." });
  }
};

export const updateBuyer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid buyer ID format." });
      return;
    }

    const buyer = await updateBuyerService(BigInt(id), req.body);
    res.status(200).json({ message: "Buyer updated successfully.", buyer });
  } catch (error: any) {
    console.error("Update buyer error:", error);
    res.status(400).json({ error: error.message || "Failed to update buyer." });
  }
};

export const deleteBuyer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid buyer ID format." });
      return;
    }

    const result = await deleteBuyerService(BigInt(id));
    res.status(200).json({ message: "Buyer deleted or deactivated successfully.", buyer: result });
  } catch (error: any) {
    console.error("Delete buyer error:", error);
    res.status(400).json({ error: error.message || "Failed to delete buyer." });
  }
};

// ==========================================
// 2. CROP LISTING CONTROLLERS
// ==========================================

export const listCropListings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const role = await getUserRole(req.user.id);
    if (!role) {
      res.status(401).json({ error: "User role not found." });
      return;
    }

    const { status, cropType } = req.query;
    const filters: any = {};
    if (status) {
      filters.status = status as ListingStatus;
    }
    if (cropType) {
      filters.cropType = cropType as string;
    }

    const listings = await listCropListingsService(role, BigInt(req.user.id), filters);
    res.status(200).json({ listings });
  } catch (error: any) {
    console.error("List listings error:", error);
    res.status(500).json({ error: "Failed to retrieve crop listings." });
  }
};

export const getCropListingById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const role = await getUserRole(req.user.id);
    if (!role) {
      res.status(401).json({ error: "User role not found." });
      return;
    }

    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid listing ID format." });
      return;
    }

    const listing = await getCropListingByIdService(BigInt(id), role, BigInt(req.user.id));
    res.status(200).json({ listing });
  } catch (error: any) {
    console.error("Get listing error:", error);
    res.status(404).json({ error: error.message || "Crop listing not found." });
  }
};

export const updateCropListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid listing ID format." });
      return;
    }

    const listing = await updateCropListingService(BigInt(id), req.body);
    res.status(200).json({ message: "Crop listing updated successfully.", listing });
  } catch (error: any) {
    console.error("Update listing error:", error);
    res.status(400).json({ error: error.message || "Failed to update crop listing." });
  }
};

// ==========================================
// 3. BUYER MATCHMAKING CONTROLLERS (Admin only)
// ==========================================

export const createBuyerMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const match = await createBuyerMatchService(req.body, BigInt(req.user.id));
    res.status(201).json({ message: "Buyer match proposed successfully.", match });
  } catch (error: any) {
    console.error("Create match error:", error);
    res.status(400).json({ error: error.message || "Failed to propose buyer match." });
  }
};

export const updateMatchStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid match ID format." });
      return;
    }

    const match = await updateMatchStatusService(BigInt(id), req.body, BigInt(req.user.id));
    res.status(200).json({ message: "Match status updated successfully.", match });
  } catch (error: any) {
    console.error("Update match status error:", error);
    res.status(400).json({ error: error.message || "Failed to update match status." });
  }
};
