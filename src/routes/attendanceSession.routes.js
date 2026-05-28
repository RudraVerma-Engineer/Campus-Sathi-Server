import express from "express";

import { authMiddleware as authUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware";
import { validationMiddlewareFactory } from "../middlewares/validationMiddlewareFactory.js";
import {
  createAttendanceSessionValidationSchema,
  updateAttendanceSessionValidationSchema,
} from "../validations/attendanceSession.validation.js";
import {
  createAttendanceSession,
  deleteAttendanceSession,
  getAllAttendanceSessions,
  getSingleAttendanceSession,
  updateAttendanceSession,
} from "../controller/attendanceSession.controller.js";

const router = express.Router();

// create attendance session
router.post(
  "/create",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(createAttendanceSessionValidationSchema),
  createAttendanceSession,
);

// get all sessions
router.get("/", authUser, getAllAttendanceSessions);

// get single session
router.get("/:sessionId", authUser, getSingleAttendanceSession);

//update session
router.patch(
  "/:sessionId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(updateAttendanceSessionValidationSchema),
  updateAttendanceSession,
);

// delete session
router.delete(
  "/:sessionId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  deleteAttendanceSession,
);

export default router;