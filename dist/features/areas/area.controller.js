import { createAreaService, getAreasService, getAreaByIdService } from "./area.service.js";
/**
 * @route   POST /api/areas
 * @desc    Create a new agricultural area
 * @access  Private (Admin only)
 */
export const createArea = async (req, res) => {
    try {
        const area = await createAreaService(req.body);
        res.status(201).json({
            message: "Area created successfully.",
            area,
        });
    }
    catch (error) {
        console.error("Create area controller error:", error);
        res.status(400).json({ error: error.message || "Failed to create area." });
    }
};
/**
 * @route   GET /api/areas
 * @desc    Get all areas
 * @access  Public
 */
export const getAreas = async (req, res) => {
    try {
        const areas = await getAreasService();
        res.status(200).json({ areas });
    }
    catch (error) {
        console.error("Get areas controller error:", error);
        res.status(500).json({ error: "Failed to retrieve areas." });
    }
};
/**
 * @route   GET /api/areas/:id
 * @desc    Get area by ID
 * @access  Public
 */
export const getAreaById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid area ID format." });
            return;
        }
        const area = await getAreaByIdService(BigInt(id));
        res.status(200).json({ area });
    }
    catch (error) {
        console.error("Get area by id controller error:", error);
        res.status(404).json({ error: error.message || "Area not found." });
    }
};
