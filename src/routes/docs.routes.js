import express from "express";

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Campus Sathi API Information
 *     description: Returns API information, version, and available routes.
 *     tags:
 *       - System
 *
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    project: "Campus Sathi API",
    version: "1.0.0",
    status: "Running",

    routes: {
      authentication: {
        register: "/api/v1/auth/register",
        login: "/api/v1/auth/login",
        logout: "/api/v1/auth/logout",
        verifyOTP: "/api/v1/auth/verify-otp",
      },

      profile: {
        getProfile: "/api/v1/auth/profile",
        updateProfile: "/api/v1/auth/update-profile",
      },

      administration: {
        createFaculty: "/api/v1/auth/create-faculty",
        createAdmin: "/api/v1/auth/create-admin",
      },
    },

    documentation: "/api-docs",
  });
});

export default router;
