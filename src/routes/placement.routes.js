import express from "express";
import { authMiddleware as authUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  applyToDrive,
  createCompany,
  createDrive,
  deleteCompany,
  getCompanies,
  getDrive,
  getDriveApplicants,
  getDrives,
  getPlacementStats,
  updateApplicationStatus,
  updateCompany,
} from "../controller/placement.controller.js";

const staff = authorizeRoles("faculty", "admin", "superAdmin");

export const placementRouter = express.Router();
placementRouter.get("/", authUser, getDrives);
placementRouter.get("/stats", authUser, getPlacementStats);
placementRouter.post("/", authUser, staff, createDrive);
placementRouter.get("/:driveId", authUser, getDrive);
placementRouter.post("/:driveId/apply", authUser, authorizeRoles("student"), applyToDrive);
placementRouter.get("/:driveId/applicants", authUser, staff, getDriveApplicants);
placementRouter.patch("/:driveId/applications/:studentId", authUser, staff, updateApplicationStatus);

export const companyRouter = express.Router();
companyRouter.get("/", authUser, getCompanies);
companyRouter.post("/", authUser, staff, createCompany);
companyRouter.patch("/:companyId", authUser, staff, updateCompany);
companyRouter.delete("/:companyId", authUser, authorizeRoles("admin", "superAdmin"), deleteCompany);
