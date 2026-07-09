import { raiseRequestService, getFarmerRequestsService, getAdminRequestsService, getRequestByIdService, updateRequestStatusService, } from "./request.service.js";
import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
/**
 * Helper to fetch database user role
 */
const getUserRole = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: { role: true },
    });
    return user ? user.role : null;
};
/**
 * @route   POST /api/requests
 * @desc    Raise a new service request (Farmer only)
 * @access  Private (Farmer)
 */
export const raiseRequest = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const request = await raiseRequestService(BigInt(req.user.id), req.body);
        res.status(201).json({
            message: "Request raised successfully.",
            request,
        });
    }
    catch (error) {
        console.error("Raise request controller error:", error);
        res.status(400).json({ error: error.message || "Failed to raise request." });
    }
};
/**
 * @route   GET /api/requests
 * @desc    Get service requests (Farmers get their own, Admins get filtered list of all)
 * @access  Private (Farmer / Admin)
 */
export const getRequests = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const role = await getUserRole(req.user.id);
        if (!role) {
            res.status(401).json({ error: "User not found." });
            return;
        }
        // Extract common filters
        const status = req.query.status;
        const requestType = req.query.requestType;
        if (role === Role.admin) {
            const areaId = req.query.areaId ? BigInt(req.query.areaId) : undefined;
            const requests = await getAdminRequestsService({ status, requestType, areaId });
            res.status(200).json({ requests });
        }
        else {
            const requests = await getFarmerRequestsService(BigInt(req.user.id), { status, requestType });
            res.status(200).json({ requests });
        }
    }
    catch (error) {
        console.error("Get requests controller error:", error);
        res.status(500).json({ error: "Failed to retrieve requests." });
    }
};
/**
 * @route   GET /api/requests/:id
 * @desc    Get request by ID (Farmers can access only their own requests)
 * @access  Private (Farmer / Admin)
 */
export const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid request ID format." });
            return;
        }
        const role = await getUserRole(req.user.id);
        if (!role) {
            res.status(401).json({ error: "User not found." });
            return;
        }
        const request = await getRequestByIdService(BigInt(id), BigInt(req.user.id), role);
        res.status(200).json({ request });
    }
    catch (error) {
        console.error("Get request by ID controller error:", error);
        const status = error.message.includes("Unauthorized") ? 403 : 404;
        res.status(status).json({ error: error.message || "Request not found." });
    }
};
/**
 * @route   PATCH /api/requests/:id/status
 * @desc    Update service request status (Admin only)
 * @access  Private (Admin)
 */
export const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid request ID format." });
            return;
        }
        const request = await updateRequestStatusService(BigInt(id), BigInt(req.user.id), req.body);
        res.status(200).json({
            message: "Request status updated successfully.",
            request,
        });
    }
    catch (error) {
        console.error("Update request status controller error:", error);
        res.status(400).json({ error: error.message || "Failed to update request status." });
    }
};
