import express from "express";
import { authMiddleware as authUser } from "../middlewares/auth.middleware.js";
import { validationMiddlewareFactory } from "../middlewares/validationMiddlewareFactory.js";
import {
  bulkDeleteAttendance,
  bulkUpdateAttendance,
  deleteAttendanceRecord,
  getSessionAttendance,
  getStudentAttendanceSummary,
  markAttendance,
  updateAttendanceRecord,
} from "../controller/attendanceRecord.controller.js";
import {
  bulkDeleteAttendanceValidationSchema,
  bulkUpdateAttendanceValidationSchema,
  markAttendanceValidationSchema,
  updateAttendanceRecordValidationSchema,
} from "../validations/attendanceRecord.validation.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

//mark single attendance
router.post(
  "/mark/:sessionId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(markAttendanceValidationSchema),
  markAttendance,
);

//get session attendance

router.get("/session/:sessionId", authUser, getSessionAttendance);

// get student atendance Summary
router.get("/student/:studentId", authUser, getStudentAttendanceSummary);

//update attendance
router.patch(
  "/update/:recordId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(updateAttendanceRecordValidationSchema),
  updateAttendanceRecord,
);

//bulk update routes
router.patch(
  "/bulk-update",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(bulkUpdateAttendanceValidationSchema),
  bulkUpdateAttendance,
);

// delete Attendance Record routes
router.delete(
  "/:recordId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  deleteAttendanceRecord,
);

// bulk delete routes
router.delete(
  "/bulk/delete",
  authUser,
  authorizeRoles("admin", "superAdmin"),
  validationMiddlewareFactory(bulkDeleteAttendanceValidationSchema),
  bulkDeleteAttendance,
);

export default router;
