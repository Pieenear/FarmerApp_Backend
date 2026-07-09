import { createStaffService, getStaffListService, getStaffByIdService, updateStaffService, deleteStaffService, assignRequestToStaffService, } from "./staff.service.js";
export const createStaff = async (req, res) => {
    try {
        const staff = await createStaffService(req.body);
        res.status(201).json({
            message: "Ground Staff member created successfully.",
            staff,
        });
    }
    catch (error) {
        console.error("Create staff controller error:", error);
        const status = error.message.includes("already registered") ? 409 : 400;
        res.status(status).json({ error: error.message || "Failed to create ground staff." });
    }
};
export const getStaffList = async (req, res) => {
    try {
        const areaId = req.query.areaId ? BigInt(req.query.areaId) : undefined;
        const availabilityStatus = req.query.availabilityStatus;
        const staff = await getStaffListService({ areaId, availabilityStatus });
        res.status(200).json({ staff });
    }
    catch (error) {
        console.error("Get staff list controller error:", error);
        res.status(500).json({ error: "Failed to retrieve staff list." });
    }
};
export const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid staff ID format." });
            return;
        }
        const staff = await getStaffByIdService(BigInt(id));
        res.status(200).json({ staff });
    }
    catch (error) {
        console.error("Get staff by ID controller error:", error);
        res.status(404).json({ error: error.message || "Ground Staff member not found." });
    }
};
export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid staff ID format." });
            return;
        }
        const staff = await updateStaffService(BigInt(id), req.body);
        res.status(200).json({
            message: "Ground Staff profile updated successfully.",
            staff,
        });
    }
    catch (error) {
        console.error("Update staff controller error:", error);
        const status = error.message.includes("in use") ? 409 : 400;
        res.status(status).json({ error: error.message || "Failed to update ground staff." });
    }
};
export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid staff ID format." });
            return;
        }
        await deleteStaffService(BigInt(id));
        res.status(200).json({ message: "Ground Staff member deleted successfully." });
    }
    catch (error) {
        console.error("Delete staff controller error:", error);
        res.status(400).json({ error: error.message || "Failed to delete ground staff." });
    }
};
export const assignRequestToStaff = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { requestId, staffId } = req.body;
        const request = await assignRequestToStaffService(BigInt(requestId), BigInt(staffId), BigInt(req.user.id));
        res.status(200).json({
            message: "Staff member assigned to service request successfully.",
            request,
        });
    }
    catch (error) {
        console.error("Assign request controller error:", error);
        res.status(400).json({ error: error.message || "Failed to assign staff." });
    }
};
