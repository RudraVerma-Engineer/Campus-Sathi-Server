import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import { validationMiddlewareFactory } from "../middlewares/validationMiddlewareFactory.js";
import {
  getSessionAttendance,
  getStudentAttendance,
  markAttendance,
  updateAttendance,
} from "../controller/attendanceRecord.controller.js";
import {
  bulkAttendanceValidationSchema,
  markAttendanceValidationSchema,
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

//bulk mark attendance
router.post(
  "/bulk/:sessionId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(bulkAttendanceValidationSchema),
  bulkMarkAttendance,
);

//get session attendance

router.get("/session/:sessionId", authUser, getSessionAttendance);

// get student atendance
router.get("/student/:studentId", authUser, getStudentAttendance);

//update attendance
router.put(
  "/:recordId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  updateAttendance,
);

export default router;
