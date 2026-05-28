import express from "express";

import { authMiddleware as authUser } from "../middlewares/auth.middleware.js";
import { generateAttendanceQR, scanAttendanceQR } from "../controller/attendanceQR.controller.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";


const router = express.Router();

//faculty generate qr

router.post("/generate/:sessionId", authUser, authorizeRoles("faculty","admin","superAdmin"), generateAttendanceQR);

// student scan qr 
router.post("/scan", authUser, authorizeRoles("student"),scanAttendanceQR);

export default router;

