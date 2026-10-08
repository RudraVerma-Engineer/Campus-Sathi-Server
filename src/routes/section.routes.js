import express from "express";
import { authMiddleware as authUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  addStudentsToSection,
  createSection,
  deleteSection,
  getAllSections,
  getMySection,
  getSingleSection,
} from "../controller/section.controller.js";

const router = express.Router();

router.get("/", authUser, getAllSections);
router.get("/my", authUser, getMySection);
router.post(
  "/create",
  authUser,
  authorizeRoles("admin", "superAdmin"),
  createSection,
);
router.get(
  "/:sectionId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  getSingleSection,
);
router.post(
  "/:sectionId/students",
  authUser,
  authorizeRoles("admin", "superAdmin"),
  addStudentsToSection,
);
router.delete(
  "/:sectionId",
  authUser,
  authorizeRoles("admin", "superAdmin"),
  deleteSection,
);

export default router;
