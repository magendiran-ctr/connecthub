import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import api from "./routes/api.js";
import { notFound, errorHandler } from "./middleware/error.js";

const allowedOrigins = new Set([
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => {
      const origin = value.trim();
      if (!origin) return null;
      try {
        return new URL(origin).origin;
      } catch {
        return origin;
      }
    })
    .filter(Boolean),
]);

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true }),
  api,
);
app.use(notFound);
app.use(errorHandler);

export default app;
