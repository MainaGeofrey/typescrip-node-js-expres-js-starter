import { Logger, winstonLogger } from "./logger";
import { config } from "@/config";

// Export factory function to create loggers with application name as default
export default function createLogger(module: string = config.app.name): Logger {
  return new Logger(module);
}

// Export the base logger for direct use, namespaced to the application
export const baseLogger = new Logger(config.app.name);

// Export the winston logger directly if needed
export { winstonLogger };

// Export the Logger class for type definitions
export { Logger };

// Export types for better TypeScript support
export type { Logger as LoggerType };

// Convenience exports for common modules
export const logger = createLogger();
export const dbLogger = createLogger("database");
export const httpLogger = createLogger("http");
export const authLogger = createLogger("auth");
