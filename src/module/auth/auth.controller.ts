import { Request, Response } from "express";
import {
  signupFarmerService,
  signupAdminService,
  loginUserService,
  getUserByIdService,
  updateProfileService,
  getUsersService,
  verifyUserService,
} from "./auth.service.js";

export const signupFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await signupFarmerService(req.body);
    res.status(201).json({
      message: "Farmer registered successfully. Verification pending by admin.",
      ...result,
    });
  } catch (error: any) {
    console.error("Farmer signup controller error:", error);
    res.status(400).json({ error: error.message || "Registration failed." });
  }
};

export const signupAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await signupAdminService(req.body);
    res.status(201).json({
      message: "Admin registered successfully.",
      ...result,
    });
  } catch (error: any) {
    console.error("Admin signup controller error:", error);
    const status = error.message.includes("secret") ? 403 : 400;
    res.status(status).json({ error: error.message || "Admin registration failed." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUserService(req.body);
    res.status(200).json({
      message: "Login successful.",
      ...result,
    });
  } catch (error: any) {
    console.error("Login controller error:", error);
    const isAuthError = error.message.includes("Invalid") || error.message.includes("denied");
    res.status(isAuthError ? 401 : 400).json({ error: error.message || "Authentication failed." });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }

    const user = await getUserByIdService(BigInt(req.user.id));
    res.status(200).json({ user });
  } catch (error: any) {
    console.error("Get me controller error:", error);
    res.status(404).json({ error: error.message || "User profile not found." });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }
    const userId = BigInt(req.user.id);
    const updatedUser = await updateProfileService(userId, req.body);
    res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update profile controller error:", error);
    res.status(400).json({ error: error.message || "Failed to update profile." });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.query.role as string | undefined;
    const isVerified = req.query.isVerified !== undefined ? req.query.isVerified === "true" : undefined;
    const search = req.query.search as string | undefined;

    const users = await getUsersService({ role, isVerified, search });
    res.status(200).json({ users });
  } catch (error: any) {
    console.error("Get users controller error:", error);
    res.status(500).json({ error: "Failed to retrieve users." });
  }
};

export const verifyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid user ID format." });
      return;
    }
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }
    const isVerified = req.body.isVerified !== undefined ? Boolean(req.body.isVerified) : true;
    const user = await verifyUserService(BigInt(id), isVerified, BigInt(req.user.id));
    res.status(200).json({
      message: `User verification status updated successfully.`,
      user,
    });
  } catch (error: any) {
    console.error("Verify user controller error:", error);
    res.status(400).json({ error: error.message || "Failed to update verification status." });
  }
};
