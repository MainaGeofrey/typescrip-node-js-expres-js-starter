import dotenv from "dotenv";
dotenv.config();

export const config = {
  app: {
    name: process.env.APP_NAME || "App",
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000"),
    host: process.env.HOST || "localhost",
  },
  postgres: {
    host: process.env.DB_HOST || "",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
  },
  mysql: {
    host: process.env.MYSQL_DB_HOST || "",
    port: parseInt(process.env.MYSQL_DB_PORT || "3306"),
    user: process.env.MYSQL_DB_USER || "",
    password: process.env.MYSQL_DB_PASSWORD || "",
    database: process.env.MYSQL_DB_NAME || "",
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || "",
    apiKeyPrefix: process.env.APIKEY_PREFIX || "",
  },
  services: {
    walletService: process.env.WALLET_SERVICE || "",
  },
};
