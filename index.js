import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

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

// db calling
connectDB();

const app = express();

//middlewares

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//routes
app.get("/", (req, res) => {
  res.send("Campus sathi API running");
});

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

//listening server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
