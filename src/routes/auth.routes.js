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
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

//public routes

//register user routes
/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a New Student
 *     description: Creates a new Campus Sathi student account and sends an OTP to the registered email for account verification.
 *     tags:
 *       - Authentication
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - fullname
 *               - username
 *               - email
 *               - password
 *               - rollNumber
 *               - course
 *               - department
 *               - semester
 *
 *             properties:
 *               fullname:
 *                 type: object
 *                 required:
 *                   - firstname
 *                 properties:
 *                   firstname:
 *                     type: string
 *                     minLength: 3
 *                     example: Rudra
 *
 *                   lastname:
 *                     type: string
 *                     minLength: 3
 *                     example: Verma
 *
 *               username:
 *                 type: string
 *                 minLength: 5
 *                 example: rudraverma
 *
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rudra@gmail.com
 *
 *               phone:
 *                 type: string
 *                 example: 9876543210
 *
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Rudra@123
 *
 *               rollNumber:
 *                 type: string
 *                 example: 2201230100123
 *
 *               course:
 *                 type: string
 *                 example: BTech
 *
 *               department:
 *                 type: string
 *                 example: Computer Science & Engineering
 *
 *               semester:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8
 *                 example: 6
 *
 *               section:
 *                 type: string
 *                 enum:
 *                   - A
 *                   - B
 *                   - C
 *                   - D
 *                 example: A
 *
 *               batchYear:
 *                 type: integer
 *                 example: 2022
 *
 *               bio:
 *                 type: string
 *                 maxLength: 200
 *                 example: Full Stack Developer and AI Enthusiast
 *
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - React Native
 *                   - Node.js
 *                   - MongoDB
 *
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Artificial Intelligence
 *                   - Web Development
 *
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Computer Networks
 *                   - DBMS
 *
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *
 *       400:
 *         description: Validation error
 *
 *       409:
 *         description: Username, email, or roll number already exists
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/register",
  upload.single("profilePhoto"),
  validationMiddlewareFactory(registerValidationSchema),
  registerUser,
);

// login routes

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login User
 *     description: Authenticate a verified user and return JWT token.
 *     tags:
 *       - Authentication
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rudra@gmail.com
 *
 *               password:
 *                 type: string
 *                 example: Rudra@123
 *
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Login successfully
 *
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *
 *       401:
 *         description: Invalid email or password
 *
 *       403:
 *         description: Account not verified or blocked
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/login",
  validationMiddlewareFactory(loginValidationSchema),
  loginUser,
);

//protected routes

//logout routes
/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout User
 *     description: Logout current user and clear JWT cookie.
 *     tags:
 *       - Authentication
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Logout successful
 *
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authMiddleware, logoutUser);

//get details of profile router
/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get Current User Profile
 *     description: Returns profile details of authenticated user.
 *     tags:
 *       - Authentication
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: User not found
 */
router.get("/profile", authMiddleware, getProfile);

//update profile routes
/**
 * @swagger
 * /api/v1/auth/update-profile:
 *   patch:
 *     summary: Update User Profile
 *     description: Update allowed profile fields.
 *     tags:
 *       - Authentication
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             properties:
 *               fullname:
 *                 type: object
 *                 properties:
 *                   firstname:
 *                     type: string
 *                   lastname:
 *                     type: string
 *
 *               phone:
 *                 type: string
 *
 *               bio:
 *                 type: string
 *
 *               semester:
 *                 type: integer
 *
 *               section:
 *                 type: string
 *                 enum: [A,B,C,D]
 *
 *               currentCGPA:
 *                 type: number
 *
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *
 *       400:
 *         description: Invalid data
 *
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/update-profile",
  authMiddleware,
  validationMiddlewareFactory(updateProfileValidationSchema),
  updateProfile,
);

// verifying otp
/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify Account OTP
 *     description: Verify newly registered user account using OTP.
 *     tags:
 *       - Authentication
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - email
 *               - otp
 *
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rudra@gmail.com
 *
 *               otp:
 *                 type: string
 *                 example: "123456"
 *
 *     responses:
 *       200:
 *         description: Account verified successfully
 *
 *       400:
 *         description: Invalid OTP or OTP expired
 *
 *       404:
 *         description: User not found
 */
router.post(
  "/verify-otp",
  validationMiddlewareFactory(verifyOTPvalidationSchema),
  verifyOTP,
);

//create faculty routes
/**
 * @swagger
 * /api/v1/auth/create-faculty:
 *   post:
 *     summary: Create Faculty Account
 *     description: Admin or Super Admin can create faculty accounts.
 *     tags:
 *       - Admin
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       201:
 *         description: Faculty created successfully
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Access denied
 *
 *       409:
 *         description: User already exists
 */
router.post(
  "/create-faculty",
  authMiddleware,
  authorizeRoles("admin", "superAdmin"),
  createFaculty,
);

//create admin routes
/**
 * @swagger
 * /api/v1/auth/create-admin:
 *   post:
 *     summary: Create Admin Account
 *     description: Only Super Admin can create admin accounts.
 *     tags:
 *       - Super Admin
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       201:
 *         description: Admin created successfully
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Only Super Admin can access
 *
 *       409:
 *         description: User already exists
 */
router.post(
  "/create-admin",
  authMiddleware,
  authorizeRoles("superAdmin"),
  createAdmin,
);
export default router;
