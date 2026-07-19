import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../generated/prisma/client.js";
import { FarmerSignupInput, AdminSignupInput, LoginInput } from "./auth.schema.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const ADMIN_SIGNUP_SECRET = process.env.ADMIN_SIGNUP_SECRET || "admin_super_secret_123";

// Helper function to generate JWT
export const generateToken = (userId: bigint): string => {
  return jwt.sign({ id: Number(userId) }, JWT_SECRET, { expiresIn: "30d" });
};

// Helper to remove passwordHash from user object
export const sanitizeUser = (user: any) => {
  if (!user) return null;
  const { passwordHash, ...sanitized } = user;
  return sanitized;
};

//Service to register a new Farmer and their associated FarmerProfile
export const signupFarmerService = async (data: FarmerSignupInput) => {
  const {
    phone,
    password,
    name,
    areaId,
    languagePref,
    farmSizeAcres,
    landLocation,
    primaryCrops,
    landSurveyNo,
  } = data;

  // Check if phone number is already registered
  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) {
    throw new Error("Phone number is already registered.");
  }

  // Verify area exists if provided
  if (areaId) {
    const area = await prisma.area.findUnique({
      where: { id: BigInt(areaId) },
    });
    if (!area) {
      throw new Error("Invalid areaId. Specified area does not exist.");
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Database transaction: Create User & Profile
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        phone,
        passwordHash: hashedPassword,
        name,
        role: Role.farmer,
        areaId: areaId ? BigInt(areaId) : null,
        languagePref: languagePref || "en",
        isActive: true,
        isVerified: false,
      },
    });

    const farmerProfile = await tx.farmerProfile.create({
      data: {
        userId: user.id,
        farmSizeAcres: farmSizeAcres ? Number(farmSizeAcres) : null,
        landLocation: landLocation || null,
        primaryCrops: primaryCrops || null,
        landSurveyNo: landSurveyNo || null,
      },
    });

    return { user, farmerProfile };
  }, {
    timeout: 20000
  });

  const token = generateToken(result.user.id);

  return {
    user: sanitizeUser(result.user),
    profile: result.farmerProfile,
    token,
  };
};

// Service to register a new Admin user

export const signupAdminService = async (data: AdminSignupInput) => {
  const { phone, password, name, email, secret } = data;

  if (secret !== ADMIN_SIGNUP_SECRET) {
    throw new Error("Invalid admin signup secret.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) {
    throw new Error("Phone number is already registered.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash: hashedPassword,
      name,
      email: email || null,
      role: Role.admin,
      isActive: true,
      isVerified: true,
    },
  });

  const token = generateToken(user.id);

  return {
    user: sanitizeUser(user),
    token,
  };
};

// Service to login users (farmers and admins)

export const loginUserService = async (data: LoginInput) => {
  const { phone, password } = data;

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      farmerProfile: true,
      area: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid phone number or password.");
  }

  if (!user.isActive) {
    throw new Error("Access denied. Your account is deactivated.");
  }

  if (!user.isVerified) {
    throw new Error("Access denied. Your account is pending verification by an admin.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid phone number or password.");
  }

  const token = generateToken(user.id);

  return {
    user: sanitizeUser(user),
    token,
  };
};

// Service to find an active user by ID

export const getUserByIdService = async (id: bigint) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      farmerProfile: true,
      area: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return sanitizeUser(user);
};

export const updateProfileService = async (userId: bigint, data: any) => {
  const {
    name,
    areaId,
    languagePref,
    farmSizeAcres,
    landLocation,
    primaryCrops,
    landSurveyNo,
  } = data;

  await prisma.$transaction(async (tx) => {
    // Update User fields
    await tx.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        areaId: areaId !== undefined ? (areaId ? BigInt(areaId) : null) : undefined,
        languagePref: languagePref !== undefined ? languagePref : undefined,
      },
    });

    // Check if profile exists, update or create
    const existingProfile = await tx.farmerProfile.findUnique({
      where: { userId: userId },
    });

    if (existingProfile) {
      await tx.farmerProfile.update({
        where: { userId: userId },
        data: {
          farmSizeAcres: farmSizeAcres !== undefined ? (farmSizeAcres ? Number(farmSizeAcres) : null) : undefined,
          landLocation: landLocation !== undefined ? landLocation : undefined,
          primaryCrops: primaryCrops !== undefined ? primaryCrops : undefined,
          landSurveyNo: landSurveyNo !== undefined ? landSurveyNo : undefined,
        },
      });
    } else {
      await tx.farmerProfile.create({
        data: {
          userId: userId,
          farmSizeAcres: farmSizeAcres ? Number(farmSizeAcres) : null,
          landLocation: landLocation || null,
          primaryCrops: primaryCrops || null,
          landSurveyNo: landSurveyNo || null,
        },
      });
    }
  }, {
    timeout: 20000
  });

  return getUserByIdService(userId);
};

export const getUsersService = async (filters: { role?: string; isVerified?: boolean; search?: string }) => {
  const { role, isVerified, search } = filters;
  const whereClause: any = {};

  if (role) {
    whereClause.role = role;
  }
  if (isVerified !== undefined) {
    whereClause.isVerified = isVerified;
  }
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      farmerProfile: true,
      area: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map(sanitizeUser);
};

export const verifyUserService = async (userId: bigint, isVerified: boolean, adminId: bigint) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified,
      verifiedByAdminId: isVerified ? adminId : null,
      verifiedAt: isVerified ? new Date() : null,
    },
    include: {
      farmerProfile: true,
      area: true,
    },
  });

  return sanitizeUser(updatedUser);
};
