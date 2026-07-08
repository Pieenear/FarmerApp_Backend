import { signupFarmerService, signupAdminService, loginUserService, getUserByIdService, } from "./auth.service.js";
/**
 * @route   POST /api/auth/signup/farmer
 * @desc    Register a new farmer and profile
 * @access  Public
 */
export const signupFarmer = async (req, res) => {
    try {
        const result = await signupFarmerService(req.body);
        res.status(201).json({
            message: "Farmer registered successfully. Verification pending by admin.",
            ...result,
        });
    }
    catch (error) {
        console.error("Farmer signup controller error:", error);
        res.status(400).json({ error: error.message || "Registration failed." });
    }
};
/**
 * @route   POST /api/auth/signup/admin
 * @desc    Register a new admin (protected by secret)
 * @access  Public (Protected by secret check)
 */
export const signupAdmin = async (req, res) => {
    try {
        const result = await signupAdminService(req.body);
        res.status(201).json({
            message: "Admin registered successfully.",
            ...result,
        });
    }
    catch (error) {
        console.error("Admin signup controller error:", error);
        const status = error.message.includes("secret") ? 403 : 400;
        res.status(status).json({ error: error.message || "Admin registration failed." });
    }
};
/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const result = await loginUserService(req.body);
        res.status(200).json({
            message: "Login successful.",
            ...result,
        });
    }
    catch (error) {
        console.error("Login controller error:", error);
        const isAuthError = error.message.includes("Invalid") || error.message.includes("denied");
        res.status(isAuthError ? 401 : 400).json({ error: error.message || "Authentication failed." });
    }
};
/**
 * @route   GET /api/auth/me
 * @desc    Get current user details
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated." });
            return;
        }
        const user = await getUserByIdService(BigInt(req.user.id));
        res.status(200).json({ user });
    }
    catch (error) {
        console.error("Get me controller error:", error);
        res.status(404).json({ error: error.message || "User profile not found." });
    }
};
