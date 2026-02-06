/**
 * Request validation middleware
 * Validates request body, params, and query using Zod schemas.
 */

const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Bypass preflight requests
      if (req.method === "OPTIONS") {
        return next();
      }

      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;

      return next();
    } catch (error) {
      if (error.name === "ZodError") {
        const zodIssues = error.issues || error.errors || [];
        const errors = zodIssues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          message: "Validation failed",
          errors,
        });
      }

      return res.status(500).json({
        message: "Validation error",
        error: error.message,
      });
    }
  };
};

module.exports = { validateRequest };
