import express from "express";

import { authUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validationMiddlewareFactory } from "../middlewares/validationMiddlewareFactory.js";
import {
  createAttendanceSessionValidation,
  updateAttendanceSessionValidationSchema,
} from "../validations/attendanceSession.validation.js";
import {
  createAttendanceSession,
  deleteAttendanceSession,
  getAllAttendanceSessions,
  getSingleAttendanceSession,
  updateAttendanceSession,
} from "../controller/attendance.controller.js";

const router = express.Router();

//create attendance session
router.post(
  "/create",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(createAttendanceSessionValidation),
  createAttendanceSession,
);

//get all sessions

router.get("/", authUser, getAllAttendanceSessions);

// get single session

router.get("/:sessionId", authUser, getSingleAttendanceSession);

//update session
router.put(
  "/:sessionId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(updateAttendanceSessionValidationSchema),
  updateAttendanceSession,
);

//delete session

router.delete(
  "/:sessionId",
  authUser,
  authorizeRoles("admin", "superAdmin"),
  deleteAttendanceSession,
);

export default router;
