import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { watchPostChanges } from "./services/changeStreams.js";

connectDB()
  .then(() => {
    watchPostChanges();
    app.listen(process.env.PORT || 5000, () => console.log("API listening"));
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exitCode = 1;
  });
