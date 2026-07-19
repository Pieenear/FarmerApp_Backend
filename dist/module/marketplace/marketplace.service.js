import { prisma } from "../../lib/prisma.js";
import { ListingStatus, MatchStatus, Role, } from "../../generated/prisma/client.js";
// ==========================================
// 1. BUYER CRUD SERVICES
// ==========================================
export const createBuyerService = async (data, adminId) => {
    const { name, phone, companyName, gstNo, preferredCrops, areaId } = data;
    return await prisma.buyer.create({
        data: {
            name,
            phone: phone || null,
            companyName: companyName || null,
            gstNo: gstNo || null,
            preferredCrops: preferredCrops || null,
            areaId: areaId ? BigInt(areaId) : null,
            createdByAdminId: adminId,
        },
        include: {
            area: true,
        },
    });
};
export const listBuyersService = async (filters) => {
    return await prisma.buyer.findMany({
        where: {
            isActive: filters.isActive !== undefined ? filters.isActive : undefined,
            areaId: filters.areaId ? BigInt(filters.areaId) : undefined,
        },
        include: {
            area: true,
        },
        orderBy: { name: "asc" },
    });
};
export const getBuyerByIdService = async (id) => {
    const buyer = await prisma.buyer.findUnique({
        where: { id },
        include: {
            area: true,
            buyerMatches: {
                include: {
                    cropListing: true,
                },
            },
        },
    });
    if (!buyer) {
        throw new Error("Buyer not found.");
    }
    return buyer;
};
export const updateBuyerService = async (id, data) => {
    const { name, phone, companyName, gstNo, preferredCrops, areaId } = data;
    const existing = await prisma.buyer.findUnique({ where: { id } });
    if (!existing) {
        throw new Error("Buyer not found.");
    }
    return await prisma.buyer.update({
        where: { id },
        data: {
            name: name !== undefined ? name : undefined,
            phone: phone !== undefined ? phone || null : undefined,
            companyName: companyName !== undefined ? companyName || null : undefined,
            gstNo: gstNo !== undefined ? gstNo || null : undefined,
            preferredCrops: preferredCrops !== undefined ? preferredCrops || null : undefined,
            areaId: areaId !== undefined ? (areaId ? BigInt(areaId) : null) : undefined,
        },
        include: {
            area: true,
        },
    });
};
export const deleteBuyerService = async (id) => {
    const existing = await prisma.buyer.findUnique({ where: { id } });
    if (!existing) {
        throw new Error("Buyer not found.");
    }
    // Check if buyer has matches. If so, soft delete by marking isActive: false. Otherwise hard delete.
    const matchCount = await prisma.buyerMatch.count({
        where: { buyerId: id },
    });
    if (matchCount > 0) {
        return await prisma.buyer.update({
            where: { id },
            data: { isActive: false },
        });
    }
    return await prisma.buyer.delete({
        where: { id },
    });
};
// ==========================================
// 2. CROP LISTING SERVICES
// ==========================================
export const listCropListingsService = async (role, userId, filters) => {
    // Farmers see all open crop listings, or their own listings.
    // Admins see everything.
    return await prisma.cropListing.findMany({
        where: {
            farmerId: role === Role.farmer ? undefined : undefined, // Keep it open for marketplace visibility
            status: filters.status || (role === Role.farmer ? ListingStatus.open : undefined),
            cropType: filters.cropType ? { contains: filters.cropType, mode: "insensitive" } : undefined,
        },
        include: {
            farmer: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            request: true,
            buyerMatches: {
                include: {
                    buyer: true,
                    matchedByAdmin: {
                        select: { id: true, name: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
export const getCropListingByIdService = async (id, role, userId) => {
    const listing = await prisma.cropListing.findUnique({
        where: { id },
        include: {
            farmer: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            request: true,
            buyerMatches: {
                include: {
                    buyer: true,
                    matchedByAdmin: {
                        select: { id: true, name: true },
                    },
                },
            },
        },
    });
    if (!listing) {
        throw new Error("Crop listing not found.");
    }
    return listing;
};
export const updateCropListingService = async (id, data) => {
    const { status, askingPrice } = data;
    const existing = await prisma.cropListing.findUnique({ where: { id } });
    if (!existing) {
        throw new Error("Crop listing not found.");
    }
    return await prisma.cropListing.update({
        where: { id },
        data: {
            status: status || undefined,
            askingPrice: askingPrice !== undefined ? askingPrice : undefined,
        },
        include: {
            farmer: {
                select: { id: true, name: true },
            },
        },
    });
};
// ==========================================
// 3. BUYER MATCHMAKING SERVICES
// ==========================================
export const createBuyerMatchService = async (data, adminId) => {
    const { cropListingId, buyerId, offeredPrice } = data;
    const listing = await prisma.cropListing.findUnique({
        where: { id: BigInt(cropListingId) },
    });
    if (!listing) {
        throw new Error("Crop listing not found.");
    }
    const buyer = await prisma.buyer.findUnique({
        where: { id: BigInt(buyerId) },
    });
    if (!buyer) {
        throw new Error("Buyer not found or deactivated.");
    }
    if (!buyer.isActive) {
        throw new Error("Buyer account is currently inactive.");
    }
    // Check if this match already exists
    const existingMatch = await prisma.buyerMatch.findFirst({
        where: {
            cropListingId: BigInt(cropListingId),
            buyerId: BigInt(buyerId),
        },
    });
    if (existingMatch) {
        throw new Error("This buyer has already been matched to this crop listing.");
    }
    return await prisma.$transaction(async (tx) => {
        // 1. Create BuyerMatch
        const match = await tx.buyerMatch.create({
            data: {
                cropListingId: BigInt(cropListingId),
                buyerId: BigInt(buyerId),
                offeredPrice: offeredPrice !== undefined ? offeredPrice : null,
                matchedByAdminId: adminId,
                status: MatchStatus.proposed,
            },
            include: {
                cropListing: true,
                buyer: true,
            },
        });
        // 2. Set Crop Listing status to matched if it was open
        if (listing.status === ListingStatus.open) {
            await tx.cropListing.update({
                where: { id: BigInt(cropListingId) },
                data: { status: ListingStatus.matched },
            });
        }
        return match;
    }, {
        timeout: 20000
    });
};
export const updateMatchStatusService = async (matchId, data, adminId) => {
    const { status, offeredPrice } = data;
    const match = await prisma.buyerMatch.findUnique({
        where: { id: matchId },
        include: { cropListing: true },
    });
    if (!match) {
        throw new Error("Buyer match not found.");
    }
    return await prisma.$transaction(async (tx) => {
        // 1. Update Match details
        const updatedMatch = await tx.buyerMatch.update({
            where: { id: matchId },
            data: {
                status,
                offeredPrice: offeredPrice !== undefined ? offeredPrice : undefined,
                matchedByAdminId: adminId,
            },
            include: {
                cropListing: true,
                buyer: true,
            },
        });
        const listingId = match.cropListingId;
        // 2. State machine side-effects for Crop Listing Status
        if (status === MatchStatus.accepted) {
            // If a match is accepted, the listing status becomes matched
            await tx.cropListing.update({
                where: { id: listingId },
                data: { status: ListingStatus.matched },
            });
        }
        else if (status === MatchStatus.completed) {
            // If a match is completed/sold, the listing status becomes sold
            await tx.cropListing.update({
                where: { id: listingId },
                data: { status: ListingStatus.sold },
            });
        }
        else if (status === MatchStatus.rejected) {
            // If a match is rejected, check if there are other accepted/completed matches.
            // If not, revert the listing status to open.
            const activeMatchesCount = await tx.buyerMatch.count({
                where: {
                    cropListingId: listingId,
                    status: { in: [MatchStatus.accepted, MatchStatus.completed] },
                    id: { not: matchId },
                },
            });
            if (activeMatchesCount === 0) {
                await tx.cropListing.update({
                    where: { id: listingId },
                    data: { status: ListingStatus.open },
                });
            }
        }
        return updatedMatch;
    }, {
        timeout: 20000
    });
};
