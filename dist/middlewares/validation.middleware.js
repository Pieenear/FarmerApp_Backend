import { ZodError } from "zod";
/**
 * Express middleware to validate request body against a Zod schema
 */
export const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate req.body
            const parsed = await schema.parseAsync(req.body);
            // Replace req.body with the parsed/transformed version (e.g. string to numbers)
            req.body = parsed;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: "Validation failed",
                    details: error.issues.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};
