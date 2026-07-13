import { prisma } from "../../lib/prisma.js";
import { Role, Prisma } from "../../generated/prisma/client.js";
import { analyzeCropImage } from "./ai.service.js";
// ==========================================
// DISEASE DETECTION LOG SERVICES
// ==========================================
export const createDetectionLogService = async (data, requesterId) => {
    const { farmerId, imageUrl, detectedDisease, confidenceScore, recommendation, cropType } = data;
    const requester = await prisma.user.findUnique({
        where: { id: requesterId },
    });
    if (!requester) {
        throw new Error("Requester profile not found.");
    }
    const creatorRole = requester.role;
    let targetFarmerId = requesterId;
    if (creatorRole === Role.admin) {
        if (farmerId !== undefined) {
            targetFarmerId = BigInt(farmerId);
        }
    }
    else {
        // If farmer, they can only create logs for themselves
        if (farmerId !== undefined && BigInt(farmerId) !== requesterId) {
            throw new Error("You cannot submit a detection log for another farmer.");
        }
    }
    // Ensure farmer exists
    const farmer = await prisma.user.findUnique({
        where: { id: targetFarmerId },
    });
    if (!farmer) {
        throw new Error("Target Farmer profile not found.");
    }
    // Call AI Service directly during creation
    let aiDisease = detectedDisease || null;
    let aiConfidence = confidenceScore !== undefined ? confidenceScore : null;
    let aiRecommendation = recommendation || null;
    // Only run AI if farmer creates it and didn't provide override parameters
    if (!aiDisease) {
        try {
            const analysis = await analyzeCropImage(imageUrl, cropType || undefined, farmer.languagePref);
            aiDisease = analysis.detectedDisease;
            aiConfidence = analysis.confidenceScore;
            aiRecommendation = analysis.recommendation;
        }
        catch (err) {
            console.error("AI classification execution failed:", err);
        }
    }
    const dbConfidence = aiConfidence !== null ? new Prisma.Decimal(aiConfidence) : null;
    return await prisma.diseaseDetectionLog.create({
        data: {
            farmerId: targetFarmerId,
            imageUrl,
            detectedDisease: aiDisease,
            confidenceScore: dbConfidence,
            recommendation: aiRecommendation,
            cropType: cropType || null,
        },
        include: {
            farmer: { select: { id: true, name: true, phone: true } },
        },
    });
};
export const listDetectionLogsService = async (filters) => {
    const requester = await prisma.user.findUnique({
        where: { id: filters.requesterId },
    });
    if (!requester) {
        throw new Error("Requester profile not found.");
    }
    const role = requester.role;
    const where = {};
    if (role === Role.farmer) {
        // Farmers only see their own logs
        where.farmerId = filters.requesterId;
    }
    else {
        // Admins can query by farmerId, cropType or detectedDisease
        if (filters.farmerId) {
            where.farmerId = BigInt(filters.farmerId);
        }
        if (filters.cropType) {
            where.cropType = { contains: filters.cropType, mode: "insensitive" };
        }
        if (filters.detectedDisease) {
            where.detectedDisease = { contains: filters.detectedDisease, mode: "insensitive" };
        }
    }
    return await prisma.diseaseDetectionLog.findMany({
        where,
        include: {
            farmer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
    });
};
export const getDetectionLogByIdService = async (id, requesterId) => {
    const requester = await prisma.user.findUnique({
        where: { id: requesterId },
    });
    if (!requester) {
        throw new Error("Requester profile not found.");
    }
    const log = await prisma.diseaseDetectionLog.findUnique({
        where: { id },
        include: {
            farmer: { select: { id: true, name: true, phone: true } },
        },
    });
    if (!log) {
        throw new Error("Disease detection log not found.");
    }
    // Enforce ownership check for farmers
    if (requester.role === Role.farmer && log.farmerId !== requesterId) {
        throw new Error("Unauthorized access to this detection log.");
    }
    return log;
};
export const updateDetectionLogService = async (id, data, requesterId) => {
    const { farmerId, imageUrl, detectedDisease, confidenceScore, recommendation, cropType } = data;
    const requester = await prisma.user.findUnique({
        where: { id: requesterId },
    });
    if (!requester) {
        throw new Error("Requester profile not found.");
    }
    const existing = await prisma.diseaseDetectionLog.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new Error("Disease detection log not found.");
    }
    // Enforce ownership check
    if (requester.role === Role.farmer && existing.farmerId !== requesterId) {
        throw new Error("Unauthorized to modify this detection log.");
    }
    // Enforce role-based field restrictions:
    // Farmers cannot update diagnosis results (detectedDisease, confidenceScore, recommendation)
    if (requester.role === Role.farmer) {
        if (detectedDisease !== undefined || confidenceScore !== undefined || recommendation !== undefined) {
            throw new Error("Farmers are not authorized to update diagnosis details.");
        }
        if (farmerId !== undefined && BigInt(farmerId) !== requesterId) {
            throw new Error("You cannot assign ownership of this log to another farmer.");
        }
    }
    const dbConfidence = confidenceScore !== undefined ? new Prisma.Decimal(confidenceScore) : undefined;
    return await prisma.diseaseDetectionLog.update({
        where: { id },
        data: {
            farmerId: farmerId !== undefined ? BigInt(farmerId) : undefined,
            imageUrl: imageUrl !== undefined ? imageUrl : undefined,
            detectedDisease: detectedDisease !== undefined ? detectedDisease || null : undefined,
            confidenceScore: dbConfidence,
            recommendation: recommendation !== undefined ? recommendation || null : undefined,
            cropType: cropType !== undefined ? cropType || null : undefined,
        },
        include: {
            farmer: { select: { id: true, name: true } },
        },
    });
};
export const deleteDetectionLogService = async (id, requesterId) => {
    const requester = await prisma.user.findUnique({
        where: { id: requesterId },
    });
    if (!requester) {
        throw new Error("Requester profile not found.");
    }
    const existing = await prisma.diseaseDetectionLog.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new Error("Disease detection log not found.");
    }
    // Enforce ownership check for farmers
    if (requester.role === Role.farmer && existing.farmerId !== requesterId) {
        throw new Error("Unauthorized to delete this detection log.");
    }
    return await prisma.diseaseDetectionLog.delete({
        where: { id },
    });
};
