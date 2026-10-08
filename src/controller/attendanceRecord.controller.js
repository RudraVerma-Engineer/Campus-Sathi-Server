import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";

import { AttendanceRecord } from "../models/attendanceRecord.model.js";

import { AttendanceSession } from "../models/attendanceSession.model.js";

import { AppError } from "../utils/AppError.js";
import {
  syncSessionTotals,
  syncStudentPercentage,
} from "../utils/attendanceStats.js";

// mark attendance

export const markAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const { records } = req.body;

  const session = await AttendanceSession.findById(sessionId);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  // session validation

  if (session.status === "cancelled") {
    throw new AppError(400, "Cannot mark attendance for cancelled session");
  }

  // upsert one record per student
  await Promise.all(
    records.map((record) =>
      AttendanceRecord.findOneAndUpdate(
        { session: sessionId, student: record.student },
        {
          status: record.status,
          remarks: record.remarks || "",
          markedBy: req.user._id,
          markedAt: new Date(),
        },
        { upsert: true, returnDocument: "after" , setDefaultsOnInsert: true },
      ),
    ),
  );

  const { present: presentCount, absent: absentCount } =
    await syncSessionTotals(sessionId);
  await Promise.all(records.map((r) => syncStudentPercentage(r.student)));

  session.status = "completed";
  session.qrEnabled = false;
  await session.save();

  return res.status(200).json({
    success: true,

    message: "Attendance marked successfully",

    totalPresent: presentCount,

    totalAbsent: absentCount,
  });
});

// get session attendance

export const getSessionAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await AttendanceSession.findById(sessionId)
    .populate("subject", "name code")
    .populate("section", "name");

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  const attendance = await AttendanceRecord.find({
    session: sessionId,
  })
    .populate("student", "fullname rollNumber email")
    .populate("markedBy", "fullname role");

  return res.status(200).json({
    success: true,

    session,

    attendance,
  });
});

// get student attendance summary

export const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // students can only look at themselves
  if (req.user.role === "student" && req.user._id.toString() !== studentId) {
    throw new AppError(403, "You can only view your own attendance");
  }

  const records = await AttendanceRecord.find({ student: studentId }).populate({
    path: "session",
    populate: { path: "subject", select: "name code" },
  });

  let totalPresent = 0;
  const subjectStats = {};

  for (const record of records) {
    const subject = record.session?.subject;
    if (!subject) continue;
    const key = subject._id.toString();
    subjectStats[key] ||= {
      subjectId: key,
      subjectName: subject.name,
      subjectCode: subject.code,
      totalClasses: 0,
      totalPresent: 0,
      totalAbsent: 0,
    };
    subjectStats[key].totalClasses++;
    if (["present", "late"].includes(record.status)) {
      totalPresent++;
      subjectStats[key].totalPresent++;
    } else {
      subjectStats[key].totalAbsent++;
    }
  }

  const subjects = Object.values(subjectStats).map((s) => ({
    ...s,
    attendancePercentage: Number(
      ((s.totalPresent / s.totalClasses) * 100).toFixed(2),
    ),
  }));
  const totalClasses = subjects.reduce((n, s) => n + s.totalClasses, 0);

  return res.status(200).json({
    success: true,
    totalClasses,
    totalPresent,
    totalAbsent: totalClasses - totalPresent,
    attendancePercentage: totalClasses
      ? Number(((totalPresent / totalClasses) * 100).toFixed(2))
      : 0,
    subjectWiseAttendance: subjects,
  });
});

// update attendance Record

export const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  const { status, remarks } = req.body;

  const attendanceRecord = await AttendanceRecord.findById(recordId);

  if (!attendanceRecord) {
    throw new AppError(404, "Attendance record not found");
  }

  attendanceRecord.status = status || attendanceRecord.status;
  attendanceRecord.remarks = remarks || attendanceRecord.remarks;
  attendanceRecord.markedBy = req.user._id;

  await attendanceRecord.save();

  await syncSessionTotals(attendanceRecord.session);
  await syncStudentPercentage(attendanceRecord.student);

  return res.status(200).json({
    success: true,
    message: "Attendance record updated successfully",
    attendanceRecord,
  });
});

export const bulkUpdateAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body;
  if (!records || !records.length) {
    throw new AppError(400, "Records are required");
  }

  const touchedSessions = new Set();
  const touchedStudents = new Set();
  for (const item of records) {
    const attendanceRecord = await AttendanceRecord.findById(item.recordId);
    if (!attendanceRecord) continue;
    attendanceRecord.status = item.status;
    attendanceRecord.remarks = item.remarks || "";
    attendanceRecord.markedBy = req.user._id;
    await attendanceRecord.save();
    touchedSessions.add(attendanceRecord.session.toString());
    touchedStudents.add(attendanceRecord.student.toString());
  }
  await Promise.all([
    ...[...touchedSessions].map((id) => syncSessionTotals(id)),
    ...[...touchedStudents].map((id) => syncStudentPercentage(id)),
  ]);

  return res.status(200).json({
    success: true,
    message: "Bulk attendance updated successfully",
  });
});

export const deleteAttendanceRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  const attendanceRecord = await AttendanceRecord.findById(recordId);

  if (!attendanceRecord) {
    throw new AppError(404, "Attendance record not found");
  }

  const sessionId = attendanceRecord.session;
  const studentId = attendanceRecord.student;
  await attendanceRecord.deleteOne();
  await syncSessionTotals(sessionId);
  await syncStudentPercentage(studentId);

  return res.status(200).json({
    success: true,
    message: "Attendance record deleted successfully",
  });
});

export const bulkDeleteAttendance = asyncHandler(async (req, res) => {
  const { recordIds } = req.body;

  if (!recordIds || !recordIds.length) {
    throw new AppError(400, "Record ids are required");
  }

  await AttendanceRecord.deleteMany({
    _id: {
      $in: recordIds,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Bulk attendance records deleted successfully",
  });
});
