import express from "express";
import { authMiddleware as authUser } from "../middlewares/auth.middleware.js";
import { getStudentAttendance } from "../controller/attendanceRecord.controller.js";
import {
  getDefaulterStudents,
  getFacultyAttendanceStats,
  getSubjectWiseAttendance,
} from "../controller/attendanceAnalytics.controller.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

//overall attendance
router.get("/overall/:studentId", authUser, getStudentAttendance);

//subject wise attendance
router.get("/subject-wise/:studentId", authUser, getSubjectWiseAttendance);

// defaulter list
router.get(
  "/defaulters",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  getDefaulterStudents,
);

//faculty dashboard
router.get(
  "/faculty-dashboard",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  getFacultyAttendanceStats,
);

export default router;
