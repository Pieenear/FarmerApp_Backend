import { createGroupService, listGroupsService, joinGroupService, leaveGroupService, listGroupMembersService, deleteGroupService, } from "./groups.service.js";
// ==========================================
// FARMER GROUPS CONTROLLERS
// ==========================================
export const createGroup = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const group = await createGroupService(req.body, BigInt(req.user.id));
        res.status(201).json({ message: "Farmer group created successfully.", group });
    }
    catch (error) {
        console.error("Create group error:", error);
        res.status(400).json({ error: error.message || "Failed to create group." });
    }
};
export const listGroups = async (req, res) => {
    try {
        const { areaId, cropType } = req.query;
        const groups = await listGroupsService({
            areaId: areaId ? BigInt(areaId) : undefined,
            cropType: cropType,
        });
        res.status(200).json({ groups });
    }
    catch (error) {
        console.error("List groups error:", error);
        res.status(500).json({ error: "Failed to retrieve farmer groups." });
    }
};
export const joinGroup = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid group ID format." });
            return;
        }
        const member = await joinGroupService(BigInt(id), BigInt(req.user.id));
        res.status(201).json({ message: "Successfully joined the group.", member });
    }
    catch (error) {
        console.error("Join group error:", error);
        res.status(400).json({ error: error.message || "Failed to join group." });
    }
};
export const leaveGroup = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid group ID format." });
            return;
        }
        await leaveGroupService(BigInt(id), BigInt(req.user.id));
        res.status(200).json({ message: "Successfully left the group." });
    }
    catch (error) {
        console.error("Leave group error:", error);
        res.status(400).json({ error: error.message || "Failed to leave group." });
    }
};
export const listGroupMembers = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid group ID format." });
            return;
        }
        const members = await listGroupMembersService(BigInt(id));
        res.status(200).json({ members });
    }
    catch (error) {
        console.error("List group members error:", error);
        res.status(404).json({ error: error.message || "Group members not found." });
    }
};
export const deleteGroup = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }
        const { id } = req.params;
        if (typeof id !== "string") {
            res.status(400).json({ error: "Invalid group ID format." });
            return;
        }
        await deleteGroupService(BigInt(id), BigInt(req.user.id));
        res.status(200).json({ message: "Farmer group deleted successfully." });
    }
    catch (error) {
        console.error("Delete group error:", error);
        res.status(400).json({ error: error.message || "Failed to delete group." });
    }
};
