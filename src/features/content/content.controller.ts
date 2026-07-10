import { Request, Response } from "express";
import {
  createContentService,
  getPaginatedContentService,
  getAllContentService
} from "./content.service.js";

export const createContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized."
      });
      return;
    }

    const createdContent = await createContentService(
      BigInt(req.user.id),
      req.body
    );

    res.status(201).json({
      message: "Content created successfully.",
      content: createdContent
    });

  } catch (error: any) {
    console.error("Create content controller error:", error);

    res.status(400).json({
      error: error.message || "Failed to create content."
    });
  }
};

export const getPaginatedContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      res.status(400).json({
        error:
          "page and limit must be positive integers, and limit cannot exceed 100."
      });
      return;
    }

    const result = await getPaginatedContentService(
      page,
      limit
    );

    res.status(200).json({
      message: "Content retrieved successfully.",
      ...result
    });

  } catch (error: any) {
    console.error(
      "Get paginated content controller error:",
      error
    );

    res.status(400).json({
      error:
        error.message ||
        "Failed to retrieve content."
    });
  }
};

export const getAllContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const content = await getAllContentService();

    res.status(200).json({
      message: "All content retrieved successfully.",
      content
    });

  } catch (error: any) {
    console.error(
      "Get all content controller error:",
      error
    );

    res.status(400).json({
      error:
        error.message ||
        "Failed to retrieve all content."
    });
  }
};