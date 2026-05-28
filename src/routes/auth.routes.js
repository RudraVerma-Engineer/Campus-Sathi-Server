import express from "express";

import { validationMiddlewareFactory } from "../middlewares/validationMiddlewareFactory.js";

import {
  createAdmin,
  createFaculty,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
  verifyOTP,
} from "../controller/auth.controller.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

import {
  loginValidationSchema,
  updateProfileValidationSchema,
  registerValidationSchema,
  verifyOTPvalidationSchema,
} from "../validations/auth.validation.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

//public routes

//register user routes
router.post(
  "/register",
  validationMiddlewareFactory(registerValidationSchema),
  registerUser,
);

// login routes
router.post(
  "/login",
  validationMiddlewareFactory(loginValidationSchema),
  loginUser,
);

//protected routes

//logout routes
router.post("/logout", authMiddleware, logoutUser);

//get details of profile router
router.get("profile", authMiddleware, getProfile);

//update profile routes
router.patch(
  "/update-profile",
  authMiddleware,
  validationMiddlewareFactory(updateProfileValidationSchema),
  updateProfile,
);

// verifying otp
router.post(
  "/verify-otp",
  validationMiddlewareFactory(verifyOTPvalidationSchema),
  verifyOTP,
);

//create faculty routes
router.post(
  "/create-faculty",
  authMiddleware,
  authorizeRoles("admin", "superAdmin"),
  createFaculty,
);

//create admin routes
router.post(
  "/create-admin",
  authMiddleware,
  authorizeRoles("superAdmin"),
  createAdmin,
);
export default router;
