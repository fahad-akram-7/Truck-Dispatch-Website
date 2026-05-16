import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import driverRoutes from "./routes/drivers.routes.js";
import loadRoutes from "./routes/loads.routes.js";
import quoteRoutes from "./routes/quotes.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ success: true, message: "API healthy" }));
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/loads", loadRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use(errorHandler);

export default app;
