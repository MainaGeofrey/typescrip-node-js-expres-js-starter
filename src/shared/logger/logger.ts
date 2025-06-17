import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { getMetricsCollector } from "../metrics/index";


const metrics = getMetricsCollector("logger");
// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  verbose: "cyan",
  debug: "blue",
  silly: "grey",
};

// Setup log directory
let logDir: string;
try {
  const storageDir = path.resolve("./storage");
  logDir = path.join(storageDir, "logs");

  if (!fs.existsSync(storageDir)) {
    console.log(`Creating main storage directory at: ${storageDir}`);
    fs.mkdirSync(storageDir, { recursive: true });
  }

  if (!fs.existsSync(logDir)) {
    console.log(`Creating logs directory at: ${logDir}`);
    fs.mkdirSync(logDir, { recursive: true });
  }

  console.log(`Log directory set to: ${logDir}`);
} catch (error) {
  console.error(`Failed to create log directory: ${(error as Error).message}`);

  logDir = "./storage/log";
  try {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`Created fallback log directory: ${logDir}`);
  } catch (e) {
    console.error(
      `Critical error: Cannot create log directory even at fallback location: ${(e as Error).message}`
    );
  }
}

winston.addColors(logColors);

// Create a custom format for structured logging that's compatible with monitoring systems
const structuredFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSS",
  }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

// Create a pretty console format
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf(({ level, message, timestamp, metadata, ...rest }) => {
    // Format the message for console output
    let logMessage = `${timestamp} ${level}: ${message}`;

    // Add metadata if it exists and isn't empty
    const meta = { ...(typeof metadata === "object" && metadata !== null ? metadata : {}), ...(typeof rest === "object" && rest !== null ? rest : {}) };
    if (
      meta &&
      Object.keys(meta).length > 0 &&
      Object.keys(meta).some((key) => key !== "timestamp")
    ) {
      // Skip timestamp in the metadata
      const metaStr = JSON.stringify(meta, null, 0);
      if (metaStr !== "{}") {
        logMessage += ` ${metaStr}`;
      }
    }

    return logMessage;
  })
);

const isDevelopment = process.env.NODE_ENV !== "production";
const defaultLogLevel = isDevelopment ? "debug" : "info";

// Configure daily rotate file transport options
const dailyRotateOptions = {
  datePattern: "YYYY-MM-DD",
  zippedArchive: true, // Compress rotated logs
  maxSize: "20m", // Rotate when file reaches 20MB
  maxFiles: "90d", // Keep logs for 90 days
  auditFile: path.join(logDir, ".audit.json"), // Store audit info
  utc: false,
};

// Create the logger instance with default configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || defaultLogLevel,
  levels: logLevels,
  format: structuredFormat,
  defaultMeta: { service: process.env.APP_NAME || "APPLICATION" },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),

    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "app-%DATE%.log"),
      ...dailyRotateOptions,
    }),

    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      level: "error",
      ...dailyRotateOptions,
    }),
  ],
});

// Track log counts by level for metrics
const logCounts = {
  total: 0,
  byLevel: {} as Record<string, number>,
};

// Add metrics hook to every log event
logger.on("logged", (info: any) => {
  // Track log metrics
  logCounts.total++;
  logCounts.byLevel[info.level] = (logCounts.byLevel[info.level] || 0) + 1;

  // Record metrics on both total logs and by log level
  metrics.incrementCounter("logs_total", 1, {
    module: info.module || "unknown",
    level: info.level,
  });

  // If there was an error, track error metrics
  if (info.level === "error") {
    metrics.incrementCounter("errors_total", 1, {
      module: info.module || "unknown",
      error_type: info.error_type || "unknown",
    });
  }
});

interface LogMeta extends Record<string, any> {
  error?: Error;
  error_type?: string;
}

interface TimerResult {
  stop: (labels?: Record<string, string>) => number;
}

// Add context to logs
export class Logger {
  private module: string;
  private labels: Record<string, string>;
  private metricsCollector: typeof metrics;
  public metrics: {
    incrementCounter: (
      name: string,
      value?: number,
      labels?: Record<string, string>
    ) => number;
    setGauge: (
      name: string,
      value: number,
      labels?: Record<string, string>
    ) => number;
    observeHistogram: (
      name: string,
      value: number,
      labels?: Record<string, string>
    ) => number[];
    startTimer: (name: string) => TimerResult;
  };

  constructor(module: string, additionalLabels: Record<string, string> = {}) {
    this.module = module;
    this.labels = additionalLabels;
    this.metricsCollector = metrics;

    // Set up a metrics collector namespaced for this module
    this.metrics = {
      incrementCounter: (
        name: string,
        value: number = 1,
        labels: Record<string, string> = {}
      ) => {
        return this.metricsCollector.incrementCounter(name, value, {
          module: this.module,
          ...this.labels,
          ...labels,
        });
      },

      setGauge: (
        name: string,
        value: number,
        labels: Record<string, string> = {}
      ) => {
        return this.metricsCollector.setGauge(name, value, {
          module: this.module,
          ...this.labels,
          ...labels,
        });
      },

      observeHistogram: (
        name: string,
        value: number,
        labels: Record<string, string> = {}
      ) => {
        return this.metricsCollector.observeHistogram(name, value, {
          module: this.module,
          ...this.labels,
          ...labels,
        });
      },

      // Convenient API for timing operations
      startTimer: (name: string): TimerResult => {
        const startTime = Date.now();
        return {
          stop: (labels: Record<string, string> = {}) => {
            const duration = Date.now() - startTime;
            this.metricsCollector.observeHistogram(name, duration, {
              module: this.module,
              ...this.labels,
              ...labels,
            });
            return duration;
          },
        };
      },
    };
  }

  // Create log methods for each level
  error(message: string, meta: LogMeta = {}) {
    // Capture error type for metrics if available
    if (meta.error) {
      meta.error_type =
        meta.error.name || meta.error.constructor.name || "Error";
    }
    return logger.error(message, {
      module: this.module,
      ...this.labels,
      ...meta,
    });
  }

  warn(message: string, meta: LogMeta = {}) {
    return logger.warn(message, {
      module: this.module,
      ...this.labels,
      ...meta,
    });
  }

  info(message: string, meta: LogMeta = {}) {
    return logger.info(message, {
      module: this.module,
      ...this.labels,
      ...meta,
    });
  }

  http(message: string, meta: LogMeta = {}) {
    return logger.http(message, {
      module: this.module,
      ...this.labels,
      ...meta,
    });
  }

  verbose(message: string, meta: LogMeta = {}) {
    return logger.verbose(message, {
      module: this.module,
      ...this.labels,
      ...meta,
    });
  }

  debug(message: string, meta: LogMeta = {}) {
    return logger.debug(message, {
      module: this.module,
      ...this.labels,
      ...meta,
    });
  }

  silly(message: string, meta: LogMeta = {}) {
    return logger.silly(message, {
      module: this.module,
      ...this.labels,
      ...meta,
    });
  }

  // Generic log method
  log(level: string, message: string, meta: LogMeta = {}) {
    return logger.log(level, message, {
      module: this.module,
      ...this.labels,
      ...meta,
    });
  }

  // Add custom metrics labels for Prometheus integration
  withLabels(labels: Record<string, string>): Logger {
    return new Logger(this.module, { ...this.labels, ...labels });
  }

  // Create a child logger with additional context
  child(module: string): Logger {
    return new Logger(`${this.module}:${module}`, this.labels);
  }

  // Use this method to switch to a different transport
  // This makes it easy to add Prometheus/Grafana later
  static addTransport(transport: winston.transport): winston.Logger {
    logger.add(transport);
    return logger;
  }

  // Remove a transport by name
  static removeTransport(transportName: string): winston.Logger {
    logger.transports.forEach((transport, i) => {
      if ((transport as any).name === transportName) {
        logger.transports.splice(i, 1);
      }
    });
    return logger;
  }

  // Get log statistics for monitoring
  static getLogStats() {
    return { ...logCounts };
  }

  // Get metrics registry for monitoring
  static getMetrics() {
    return metrics;
  }

  // Return the underlying Winston logger
  static getWinstonLogger(): winston.Logger {
    return logger;
  }
}

// Export the winston logger directly if needed
export const winstonLogger = logger;
