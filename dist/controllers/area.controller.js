import { prisma } from "../lib/prisma.js";
/**
 * @route   POST /api/areas
 * @desc    Create a new area (Admin only)
 * @access  Private (Admin)
 */
export const createArea = async (req, res) => {
    try {
        const { name, taluka, district, state, pincode } = req.body;
        if (!name) {
            res.status(400).json({ error: "Area name is required." });
            return;
        }
        const area = await prisma.area.create({
            data: {
                name,
                taluka: taluka || null,
                district: district || null,
                state: state || null,
                pincode: pincode || null,
            },
        });
        res.status(201).json({
            message: "Area created successfully.",
            area,
        });
    }
    catch (error) {
        console.error("Create area error:", error);
        res.status(500).json({ error: "Internal server error creating area." });
    }
};
/**
 * @route   GET /api/areas
 * @desc    Get all areas
 * @access  Public
 */
export const getAreas = async (req, res) => {
    try {
        const areas = await prisma.area.findMany({
            orderBy: { name: "asc" },
        });
        res.status(200).json({
            areas,
        });
    }
    catch (error) {
        console.error("Get areas error:", error);
        res.status(500).json({ error: "Internal server error retrieving areas." });
    }
};
/**
 * @route   GET /api/areas/:id
 * @desc    Get area details by ID
 * @access  Public
 */
export const getAreaById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid area ID format." });
            return;
        }
        const area = await prisma.area.findUnique({
            where: { id: BigInt(id) },
        });
        if (!area) {
            res.status(404).json({ error: "Area not found." });
            return;
        }
        res.status(200).json({
            area,
        });
    }
    catch (error) {
        console.error("Get area by id error:", error);
        res.status(500).json({ error: "Internal server error retrieving area." });
    }
};
