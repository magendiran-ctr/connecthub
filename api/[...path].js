import app from "../server/app.js";
import { connectDB } from "../server/config/db.js";

let databaseConnection;

export default async function handler(req, res) {
  try {
    databaseConnection ??= connectDB().catch((error) => {
      databaseConnection = undefined;
      throw error;
    });
    await databaseConnection;

    if (!req.url.startsWith("/api")) req.url = `/api${req.url}`;
    return app(req, res);
  } catch (error) {
    console.error("API initialization failed:", error.message);
    return res.status(503).json({ message: "API database connection failed" });
  }
}
