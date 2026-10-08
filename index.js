import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import noticeRoutes from "./src/routes/notice.routes.js";
import eventRoutes from "./src/routes/event.routes.js";
import subjectRoutes from "./src/routes/subject.routes.js";
import timetableRoutes from "./src/routes/timetable.routes.js";
import attendanceAnalyticsRoutes from "./src/routes/attendanceAnalytics.routes.js";
import attendanceRecordRoutes from "./src/routes/attendanceRecord.routes.js";
import attendanceSessionRoutes from "./src/routes/attendanceSession.routes.js";
import attendanceQRRoutes from "./src/routes/attendanceQR.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger.js";
import docsRoutes from "./src/routes/docs.routes.js";
import sectionRoutes from "./src/routes/section.routes.js";
import assignmentRoutes from "./src/routes/assignment.routes.js";
import { placementRouter, companyRouter } from "./src/routes/placement.routes.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import { startAttendanceCron } from "./src/cron/attendanceSession.cron.js";

// db calling
connectDB();

const app = express();

// behind Render/Nginx the real client IP is in X-Forwarded-For
app.set("trust proxy", 1);

//middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    // mobile apps send no Origin; list web origins in CORS_ORIGINS (comma separated)
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
      : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// brute-force protection on credential endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Slow down." },
});
app.use("/api", apiLimiter);
for (const p of ["login", "register", "verify-otp", "resend-otp", "forgot-password", "reset-password", "google"]) {
  app.use(`/api/v1/auth/${p}`, authLimiter);
}

app.get("/health", (req, res) => res.json({ ok: true, time: new Date() }));

app.get("/", (req, res) => {
  res.json({
    project: "Campus Sathi API",
    version: "1.0.0",
    status: "Running",

    links: {
      docs: "/docs",
      swagger: "/swagger",
    },
  });
});

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// docs routes
app.use("/docs", docsRoutes);

// user-routes
app.use("/api/v1/auth", authRoutes);

//notice-routes
app.use("/api/v1/notices", noticeRoutes);

//event-routes
app.use("/api/v1/events", eventRoutes);

//subject-routes
app.use("/api/v1/subject", subjectRoutes);

//timetable-routes
app.use("/api/v1/timetable", timetableRoutes);

//attendance-analytics-routes
app.use("/api/v1/attendance-analytics", attendanceAnalyticsRoutes);

//attendance-record-routes
app.use("/api/v1/attendance-record", attendanceRecordRoutes);

//attendance-session-routes
app.use("/api/v1/attendance-session", attendanceSessionRoutes);

//attendance-qr-routes
app.use("/api/v1/attendance-qr", attendanceQRRoutes);

//section / assignment / placement routes
app.use("/api/v1/sections", sectionRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/placements", placementRouter);
app.use("/api/v1/companies", companyRouter);

// 404 for unknown API paths, then the central error handler (must be last)
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }),
);
app.use(errorHandler);

// attendance sessions are opened/closed automatically by time
startAttendanceCron();

//listening server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
