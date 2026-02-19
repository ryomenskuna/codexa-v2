import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";

import authRoutes from "./routes/authRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import { sendError } from "./utils/http.js";

dotenv.config();

const app = express();

// Basic security hardening
app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Simple in-memory rate limiter (per IP)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // per window per IP
const rateLimitStore = new Map();

app.use((req, res, next) => {
  const now = Date.now();
  const ip = req.ip || req.connection.remoteAddress || "unknown";

  const entry = rateLimitStore.get(ip) || { count: 0, startTime: now };

  if (now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
    entry.count = 1;
    entry.startTime = now;
  } else {
    entry.count += 1;
  }

  rateLimitStore.set(ip, entry);

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return res
      .status(429)
      .json({ message: "Too many requests, please try again later." });
  }

  next();
});

// Logging
app.use(morgan("combined"));

// Body parsing
app.use(bodyParser.json());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// CORS configuration using environment
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  process.env.FRONTEND_ORIGIN_SECONDARY,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: process.env.CORS_CREDENTIALS === "true",
};

app.use(cors(corsOptions));

// Routes
app.use("/auth", authRoutes);
app.use("/teach", teacherRoutes);
app.use("/events", eventRoutes);
app.use("/quiz", quizRoutes);

app.get("/", (req, res) => res.send("Codexa backend running ✅"));

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Avoid leaking internal details to clients
  // You can add more structured logging here if needed
  console.error("Unhandled error:", err);
  return sendError(res, 500, "Server error");
});

app.listen(PORT, "::", () => {
  console.log(`Server running on all interfaces at port ${PORT}`);
});