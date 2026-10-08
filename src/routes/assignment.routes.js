import express from "express";
import { authMiddleware as authUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  createAssignment,
  deleteAssignment,
  getAssignment,
  getAssignments,
  gradeSubmission,
  submitAssignment,
} from "../controller/assignment.controller.js";

const router = express.Router();
const staff = authorizeRoles("faculty", "admin", "superAdmin");

router.get("/", authUser, getAssignments);
router.post("/", authUser, staff, createAssignment);
router.get("/:assignmentId", authUser, getAssignment);
router.post("/:assignmentId/submit", authUser, authorizeRoles("student"), submitAssignment);
router.patch("/:assignmentId/grade/:studentId", authUser, staff, gradeSubmission);
router.delete("/:assignmentId", authUser, staff, deleteAssignment);

export default router;
