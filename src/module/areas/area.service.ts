import { prisma } from "../../lib/prisma.js";
import { CreateAreaInput } from "./area.schema.js";

//Service to create a new Area
export const createAreaService = async (data: CreateAreaInput) => {
  const { name, taluka, district, state, pincode } = data;

  return await prisma.area.create({
    data: {
      name,
      taluka: taluka || null,
      district: district || null,
      state: state || null,
      pincode: pincode || null,
    },
  });
};

// Service to get all Areas
 
export const getAreasService = async () => {
  return await prisma.area.findMany({
    orderBy: { name: "asc" },
  });
};

//Service to get a specific Area by ID
export const getAreaByIdService = async (id: bigint) => {
  const area = await prisma.area.findUnique({
    where: { id },
  });

  if (!area) {
    throw new Error("Area not found.");
  }

  return area;
};
