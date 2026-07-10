import { prisma } from "../../lib/prisma.js";
import { ContentCategory, ContentStatus, Role } from "../../generated/prisma/client.js";
import { CreateContentInput, UpdateContentInput } from "./content.schema.js";

export const createContentService = async (data: CreateContentInput, adminId: bigint) => {
  const { title, content, category, imageUrl, areaId, status } = data;

  if (areaId !== undefined && areaId !== null) {
    const area = await prisma.area.findUnique({
      where: { id: BigInt(areaId) },
    });
    if (!area) {
      throw new Error("Area not found.");
    }
  }

  const isPublished = status === ContentStatus.published;

  return await prisma.agriContent.create({
    data: {
      title,
      content,
      category,
      imageUrl: imageUrl || null,
      areaId: areaId ? BigInt(areaId) : null,
      publishedByAdminId: adminId,
      status: status || ContentStatus.draft,
      publishedAt: isPublished ? new Date() : null,
    },
    include: {
      area: true,
    },
  });
};

export const listContentService = async (filters: {
  role: Role;
  farmerAreaId?: bigint;
  category?: ContentCategory;
  status?: ContentStatus;
  areaId?: bigint;
}) => {
  const where: any = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.role === Role.farmer) {
    // Farmers only see published advisories
    where.status = ContentStatus.published;

    // Localized context: global articles (areaId is null) or specific to the farmer's area
    where.OR = [
      { areaId: null },
      { areaId: filters.farmerAreaId ? BigInt(filters.farmerAreaId) : undefined },
    ];
  } else {
    // Admins can query all statuses, categories, or specific areas
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.areaId !== undefined) {
      where.areaId = filters.areaId ? BigInt(filters.areaId) : null;
    }
  }

  return await prisma.agriContent.findMany({
    where,
    include: {
      area: true,
      publishedByAdmin: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getContentByIdService = async (id: bigint) => {
  const article = await prisma.agriContent.findUnique({
    where: { id },
    include: {
      area: true,
      publishedByAdmin: { select: { id: true, name: true } },
    },
  });

  if (!article) {
    throw new Error("Content article not found.");
  }
  return article;
};

export const updateContentService = async (id: bigint, data: UpdateContentInput) => {
  const { title, content, category, imageUrl, areaId, status } = data;

  const existing = await prisma.agriContent.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Content article not found.");
  }

  if (areaId !== undefined && areaId !== null) {
    const area = await prisma.area.findUnique({
      where: { id: BigInt(areaId) },
    });
    if (!area) {
      throw new Error("Area not found.");
    }
  }

  // Handle publishedAt timestamp transitions
  let publishedAtVal = undefined;
  if (status === ContentStatus.published && existing.status !== ContentStatus.published) {
    publishedAtVal = new Date();
  } else if (status === ContentStatus.draft || status === ContentStatus.archived) {
    publishedAtVal = null;
  }

  return await prisma.agriContent.update({
    where: { id },
    data: {
      title: title !== undefined ? title : undefined,
      content: content !== undefined ? content : undefined,
      category: category !== undefined ? category : undefined,
      imageUrl: imageUrl !== undefined ? imageUrl || null : undefined,
      areaId: areaId !== undefined ? (areaId ? BigInt(areaId) : null) : undefined,
      status: status !== undefined ? status : undefined,
      publishedAt: publishedAtVal,
    },
    include: {
      area: true,
    },
  });
};

export const deleteContentService = async (id: bigint) => {
  const existing = await prisma.agriContent.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Content article not found.");
  }

  return await prisma.agriContent.delete({
    where: { id },
  });
};
