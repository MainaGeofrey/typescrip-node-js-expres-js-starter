import morgan from "morgan";
import { httpLogger } from "@/shared/logger"; 

const stream = {
  write: (message: string) => {
    httpLogger.info(message.trim());
  },
};

const httpLoggerMiddleware = () =>
  morgan(process.env.NODE_ENV === "development" ? "dev" : "combined", {
    stream,
    skip: (_req, res) => res.statusCode < 400,
  });

export default httpLoggerMiddleware;
