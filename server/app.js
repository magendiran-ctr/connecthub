import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import api from "./routes/api.js";
import { notFound, errorHandler } from "./middleware/error.js";

let databaseConnection;

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
app.use(async (_req, _res, next) => {
  try {
    databaseConnection ??= connectDB().catch((error) => {
      databaseConnection = undefined;
      throw error;
    });
    await databaseConnection;
    next();
  } catch (error) {
    next(error);
  }
});
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true }),
  api,
);
app.use(notFound);
app.use(errorHandler);

export default app;
