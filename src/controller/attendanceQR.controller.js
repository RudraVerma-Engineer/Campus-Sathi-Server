import crypto from "crypto";

import QRCode from "qrcode";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";

// generateAttendanceQR
export const generateAttendanceQR = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await AttendanceSession.findById(sessionId);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  //generate secure token
  const qrToken = crypto.randomBytes(32).toString("hex");

  // qr expiry
  const expiresAt = new Date(Date.now() + 1000 * 60 * 2);

  session.qrToken = qrToken;

  session.qrExpiresAt = expiresAt;

  session.qrEnabled = true;

  await session.save();

  // frontend url
  const attendanceUrl = `${process.env.CLIENT_URL}/attendance/scan/${qrToken}`;

  // generate qr image

  const qrImage = await QRCode.toDataURL(attendanceUrl);

  return res.status(200).json({
    success: true,
    qrToken,
    expiresAt,
    qrImage,
  });
});

// scanAttendanceQR

export const scanAttendanceQR = asyncHandler(async (req, res) => {
  const { qrToken } = req.body;

  const session = await AttendanceSession.findOne({
    qrToken,
    qrEnabled: true,
  });

  if (!session) {
    throw new AppError(404, "Invalid QR code");
  }

  //expiry check
  if (new Date() > new Date(session.qrExpiresAt)) {
    throw new AppError(400, "QR code expired");
  }

  // duplicate check

  const alreadyMarked = await AttendanceRecord.findOne({
    session: session._id,

    student: req.user._id,
  });

  if (alreadyMarked) {
    throw new AppError(400, "Attendance already marked");
  }

  //create attendance
  await AttendanceRecord.create({
    session: session._id,
    student: req.user._id,
    status: "present",
    markedBy: req.user._id,
  });
  // update totals
  session.totalPresent += 1;
  await session.save();

  return res.status(200).json({
    success: true,

    message: "Attendance marked successfully",
  });
});
