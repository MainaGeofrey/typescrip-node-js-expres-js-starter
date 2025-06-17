import express from "express";
import dotenv from "dotenv";
import { logger } from "@/shared/logger";
import * as middleware from "@/middlewares"; // Import all middleware
import routes from "@/routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Attach custom middleware
app.use(middleware.httpLogger()); // Request logger
app.use(middleware.corsHandler); // CORS




app.use("/api", routes);

//.......
// Error handler (last)
app.use(middleware.errorHandler());

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`, {
    port: String(PORT),
    environment: process.env.NODE_ENV || "development",
  });
});

process.on("SIGINT", () => {
  logger.info("Shutting down server...");
  process.exit(0);
});
