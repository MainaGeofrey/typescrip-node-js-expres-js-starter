import cors from "cors";

const allowlist = [
  "http://127.0.0.1:3000",
  process.env.URL_DEVELOPMENT || "http://localhost:3000",
  process.env.URL_PRODUCTION,
];

const corsOptionsDelegate: cors.CorsOptionsDelegate = (req, callback) => {
  const origin = req.headers['origin'] as string | undefined;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!origin && isDevelopment) {
    return callback(null, {
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
    });
  }

  if (origin && allowlist.includes(origin)) {
    return callback(null, {
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
    });
  }

  return callback(new Error("Not allowed by CORS"), { origin: false });
};

const corsHandler = cors(corsOptionsDelegate);

export default corsHandler;
