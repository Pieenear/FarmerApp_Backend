import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import {
    authMiddleware,
    requireRole
} from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import {
    createContent,
    getPaginatedContent,
    getAllContent
} from "./content.controller.js";
import { createContentSchema } from "./content.schema.js";

const router = Router();

router.get(
    "/",
    authMiddleware,
    getPaginatedContent
);

router.get(
    "/all",
    authMiddleware,
    getAllContent
);

router.post(
    "/new",
    authMiddleware,
    requireRole([Role.admin]),
    validateRequest(createContentSchema),
    createContent
);

export default router;