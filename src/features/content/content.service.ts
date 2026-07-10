import { prisma } from "../../lib/prisma.js";
import { ContentStatus } from "../../generated/prisma/client.js";
import { CreateContentInput } from "./content.schema.js";

export const createContentService = async (
  adminId: bigint,
  data: CreateContentInput
) => {
  if (
    data.areaId !== null &&
    data.areaId !== undefined
  ) {
    const area = await prisma.area.findUnique({
      where: {
        id: BigInt(data.areaId)
      }
    });

    if (!area) {
      throw new Error("Area not found.");
    }
  }

  return prisma.agriContent.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      imageUrl: data.imageUrl ?? null,
      areaId:
        data.areaId !== null &&
        data.areaId !== undefined
          ? BigInt(data.areaId)
          : null,
      publishedByAdminId: adminId,
      status: data.status,
      publishedAt:
        data.status === ContentStatus.published
          ? new Date()
          : null
    }
  });
};

export const getPaginatedContentService = async (
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const [content, total] = await Promise.all([
    prisma.agriContent.findMany({
      skip,
      take: limit,
      orderBy: [
        {
          publishedAt: "desc"
        },
        {
          createdAt: "desc"
        }
      ]
    }),

    prisma.agriContent.count()
  ]);

  return {
    content,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getAllContentService = async () => {
  return prisma.agriContent.findMany({
    orderBy: [
      {
        publishedAt: "desc"
      },
      {
        createdAt: "desc"
      }
    ]
  });
};