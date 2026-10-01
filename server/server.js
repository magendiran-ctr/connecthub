import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import api from "./routes/api.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { watchPostChanges } from "./services/changeStreams.js";
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true }),
  api,
);
app.use(notFound);
app.use(errorHandler);
connectDB().then(() => {
  watchPostChanges();
  app.listen(process.env.PORT || 5000, () => console.log("API listening"));
});
