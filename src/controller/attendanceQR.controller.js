import crypto from "crypto";
import QRCode from "qrcode";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { AttendanceRecord } from "../models/attendanceRecord.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { AppError } from "../utils/AppError.js";
import { getStudentSection } from "../utils/enrollSection.js";
import {
  syncSessionTotals,
  syncStudentPercentage,
} from "../utils/attendanceStats.js";

const QR_TTL_SECONDS = Number(process.env.QR_EXPIRY_SECONDS) || 120;
export const QR_PREFIX = "campussathi:attendance:";

// faculty: create a short-lived QR for a session
export const generateAttendanceQR = asyncHandler(async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId);
  if (!session) throw new AppError(404, "Attendance session not found");

  const isOwner = session.faculty.toString() === req.user._id.toString();
  const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You can only open QR for your own session");
  }
  if (["cancelled", "completed"].includes(session.status)) {
    throw new AppError(400, `Session is ${session.status}`);
  }

  const qrToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + QR_TTL_SECONDS * 1000);

  session.qrToken = qrToken;
  session.qrExpiresAt = expiresAt;
  session.qrEnabled = true;
  session.attendanceMode = "qr";
  session.status = "active";
  await session.save();

  // the app scans a plain payload, not a web URL
  const qrImage = await QRCode.toDataURL(`${QR_PREFIX}${qrToken}`, {
    margin: 1,
    width: 480,
  });

  return res.status(200).json({
    success: true,
    qrToken,
    expiresAt,
    ttlSeconds: QR_TTL_SECONDS,
    qrImage,
  });
});

// student: scan the QR
export const scanAttendanceQR = asyncHandler(async (req, res) => {
  let { qrToken } = req.body;
  if (!qrToken || typeof qrToken !== "string") {
    throw new AppError(400, "qrToken is required");
  }
  if (qrToken.startsWith(QR_PREFIX)) qrToken = qrToken.slice(QR_PREFIX.length);

  const session = await AttendanceSession.findOne({ qrToken, qrEnabled: true });
  if (!session) throw new AppError(404, "Invalid QR code");

  if (new Date() > new Date(session.qrExpiresAt)) {
    throw new AppError(400, "QR code expired - ask your teacher to refresh it");
  }
  if (["cancelled", "completed"].includes(session.status)) {
    throw new AppError(400, `This class is ${session.status}`);
  }

  // only students of this section may mark themselves present
  const section = await getStudentSection(req.user._id);
  if (!section || section._id.toString() !== session.section.toString()) {
    throw new AppError(403, "You are not part of this class section");
  }

  try {
    await AttendanceRecord.create({
      session: session._id,
      student: req.user._id,
      status: "present",
      markedBy: req.user._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(400, "Attendance already marked");
    }
    throw err;
  }

  await syncSessionTotals(session._id);
  await syncStudentPercentage(req.user._id);
  await session.populate("subject", "name code");

  return res.status(200).json({
    success: true,
    message: "Attendance marked successfully",
    subject: session.subject,
  });
});
