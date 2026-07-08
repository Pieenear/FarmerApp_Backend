import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/client.js";
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const ADMIN_SIGNUP_SECRET = process.env.ADMIN_SIGNUP_SECRET || "admin_super_secret_123";
// Helper function to generate JWT
const generateToken = (userId) => {
    return jwt.sign({ id: Number(userId) }, JWT_SECRET, { expiresIn: "30d" });
};
// Helper to remove passwordHash from user object
const sanitizeUser = (user) => {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
};
/**
 * @route   POST /api/auth/signup/farmer
 * @desc    Register a new farmer and create a farmer profile
 * @access  Public
 */
export const signupFarmer = async (req, res) => {
    try {
        const { phone, password, name, areaId, languagePref, farmSizeAcres, landLocation, primaryCrops, landSurveyNo, } = req.body;
        if (!phone || !password || !name) {
            res.status(400).json({ error: "Phone, password, and name are required." });
            return;
        }
        // Check if phone number is already registered
        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });
        if (existingUser) {
            res.status(400).json({ error: "Phone number is already registered." });
            return;
        }
        // If areaId is provided, verify it exists
        if (areaId) {
            const area = await prisma.area.findUnique({
                where: { id: BigInt(areaId) },
            });
            if (!area) {
                res.status(400).json({ error: "Invalid areaId. Specified area does not exist." });
                return;
            }
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create User and FarmerProfile in a transaction
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
                    isVerified: false, // Farmers need to be verified by admin later
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
        });
        const token = generateToken(result.user.id);
        res.status(201).json({
            message: "Farmer registered successfully. Verification pending by admin.",
            user: sanitizeUser(result.user),
            profile: result.farmerProfile,
            token,
        });
    }
    catch (error) {
        console.error("Farmer signup error:", error);
        res.status(500).json({ error: "Internal server error during registration." });
    }
};
/**
 * @route   POST /api/auth/signup/admin
 * @desc    Register a new admin (requires ADMIN_SIGNUP_SECRET)
 * @access  Public (Protected by secret)
 */
export const signupAdmin = async (req, res) => {
    try {
        const { phone, password, name, email, secret } = req.body;
        if (!phone || !password || !name) {
            res.status(400).json({ error: "Phone, password, and name are required." });
            return;
        }
        // Validate signup secret to prevent unauthorized admin creation
        if (secret !== ADMIN_SIGNUP_SECRET) {
            res.status(403).json({ error: "Invalid admin signup secret." });
            return;
        }
        // Check if phone number is already registered
        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });
        if (existingUser) {
            res.status(400).json({ error: "Phone number is already registered." });
            return;
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create Admin User
        const user = await prisma.user.create({
            data: {
                phone,
                passwordHash: hashedPassword,
                name,
                email: email || null,
                role: Role.admin,
                isActive: true,
                isVerified: true, // Admins are auto-verified
            },
        });
        const token = generateToken(user.id);
        res.status(201).json({
            message: "Admin registered successfully.",
            user: sanitizeUser(user),
            token,
        });
    }
    catch (error) {
        console.error("Admin signup error:", error);
        res.status(500).json({ error: "Internal server error during registration." });
    }
};
/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token (Both farmers and admins)
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            res.status(400).json({ error: "Phone number and password are required." });
            return;
        }
        // Find user
        const user = await prisma.user.findUnique({
            where: { phone },
            include: {
                farmerProfile: true,
                area: true,
            },
        });
        if (!user || !user.passwordHash) {
            res.status(401).json({ error: "Invalid phone number or password." });
            return;
        }
        // Check active status
        if (!user.isActive) {
            res.status(403).json({ error: "Access denied. Your account is deactivated." });
            return;
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid phone number or password." });
            return;
        }
        const token = generateToken(user.id);
        res.status(200).json({
            message: "Login successful.",
            user: sanitizeUser(user),
            token,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error during authentication." });
    }
};
/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user details
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated." });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: BigInt(req.user.id) },
            include: {
                farmerProfile: true,
                area: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: "User not found." });
            return;
        }
        res.status(200).json({
            user: sanitizeUser(user),
        });
    }
    catch (error) {
        console.error("Get me error:", error);
        res.status(500).json({ error: "Internal server error retrieving user details." });
    }
};
