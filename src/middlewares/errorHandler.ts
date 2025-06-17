import type { ErrorRequestHandler } from "express";
import { logger } from "@/shared/logger";

const errorHandler = (): ErrorRequestHandler => {
  return (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;

    logger.error(`[${req.method} ${req.originalUrl}] ${err.message}`, {
      stack: err.stack,
    });

    const errorResponse = {
      title: "Error",
      errors: [
        {
          name: err.name || "Error",
          code: statusCode,
          message: err.message,
        },
      ],
    };

    if (req.xhr) {
      res.status(statusCode).json(errorResponse);
      return;
    }

    res.status(statusCode).json({
      message: err.message,
      error: err.message,
    });
    return;
  };
};

export default errorHandler;
