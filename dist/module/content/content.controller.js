import { createContentService, listContentService, getContentByIdService, updateContentService, deleteContentService, } from "./content.service.js";
import { prisma } from "../../lib/prisma.js";
// ==========================================
// AGRI CONTENT CONTROLLERS
// ==========================================
export const createContent = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const article = await createContentService(req.body, BigInt(req.user.id));
        res.status(201).json({ message: "Agri content published successfully.", article });
    }
    catch (error) {
        console.error("Create agri content error:", error);
        res.status(400).json({ error: error.message || "Failed to publish agri content." });
    }
};
export const listContent = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { category, status, areaId } = req.query;
        const dbUser = await prisma.user.findUnique({
            where: { id: BigInt(req.user.id) },
        });
        if (!dbUser) {
            res.status(401).json({ error: "User profile not found." });
            return;
        }
        const role = dbUser.role;
        const farmerAreaId = dbUser.areaId || undefined;
        const articles = await listContentService({
            role,
            farmerAreaId,
            category: category,
            status: status,
            areaId: areaId ? BigInt(areaId) : undefined,
        });
        res.status(200).json({ articles, contents: articles });
    }
    catch (error) {
        console.error("List agri content error:", error);
        res.status(500).json({ error: "Failed to retrieve agri content." });
    }
};
export const getContentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid content ID format." });
            return;
        }
        const article = await getContentByIdService(BigInt(id));
        res.status(200).json({ article });
    }
    catch (error) {
        console.error("Get agri content error:", error);
        res.status(404).json({ error: error.message || "Agri content not found." });
    }
};
export const updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid content ID format." });
            return;
        }
        const article = await updateContentService(BigInt(id), req.body);
        res.status(200).json({ message: "Agri content updated successfully.", article });
    }
    catch (error) {
        console.error("Update agri content error:", error);
        res.status(400).json({ error: error.message || "Failed to update agri content." });
    }
};
export const deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid content ID format." });
            return;
        }
        await deleteContentService(BigInt(id));
        res.status(200).json({ message: "Agri content deleted successfully." });
    }
    catch (error) {
        console.error("Delete agri content error:", error);
        res.status(400).json({ error: error.message || "Failed to delete agri content." });
    }
};
