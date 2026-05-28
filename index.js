import "dotenv/config";
import express from "express";
// import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import noticeRoutes from "./src/routes/notice.routes.js";
import eventRoutes from "./src/routes/event.routes.js";
// dotenv.config();

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

//listening server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
