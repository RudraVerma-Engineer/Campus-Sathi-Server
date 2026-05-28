import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";

import { AttendanceRecord } from "../models/attendanceRecord.model.js";

import { AttendanceSession } from "../models/attendanceSession.model.js";

import { AppError } from "../utils/AppError.js";

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

  let presentCount = 0;

  let absentCount = 0;

  // process attendance

  for (const record of records) {
    const existingRecord = await AttendanceRecord.findOne({
      session: sessionId,
      student: record.student,
    });

    // update existing record

    if (existingRecord) {
      existingRecord.status = record.status;

      existingRecord.remarks = record.remarks || "";

      existingRecord.markedBy = req.user._id;

      await existingRecord.save();
    } else {
      await AttendanceRecord.create({
        session: sessionId,

        student: record.student,

        status: record.status,

        remarks: record.remarks || "",

        markedBy: req.user._id,
      });
    }

    // count present/absent

    if (record.status === "present" || record.status === "late") {
      presentCount++;
    } else {
      absentCount++;
    }
  }

  // update session stats

  session.totalPresent = presentCount;

  session.totalAbsent = absentCount;

  session.status = "completed";

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

  const records = await AttendanceRecord.find({
    student: studentId,
  }).populate({
    path: "session",
    populate: {
      path: "subject",
      select: "name code",
    },
  });

  if (!records.length) {
    throw new AppError(404, "No attendance records found");
  }

  let totalClasses = 0;

  let totalPresent = 0;

  let totalAbsent = 0;

  // subject wise stats

  const subjectStats = {};

  for (const record of records) {
    totalClasses++;

    const subject = record.session.subject;

    const subjectId = subject._id.toString();

    // create subject entry

    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = {
        subjectName: subject.name,

        subjectCode: subject.code,

        totalClasses: 0,

        totalPresent: 0,

        totalAbsent: 0,
      };
    }

    subjectStats[subjectId].totalClasses++;

    // attendance count

    if (record.status === "present" || record.status === "late") {
      totalPresent++;

      subjectStats[subjectId].totalPresent++;
    } else {
      totalAbsent++;

      subjectStats[subjectId].totalAbsent++;
    }
  }

  // percentage calculation

  const percentage =
    totalClasses === 0 ? 0 : ((totalPresent / totalClasses) * 100).toFixed(2);

  return res.status(200).json({
    success: true,

    totalClasses,

    totalPresent,

    totalAbsent,

    attendancePercentage: percentage,

    subjectWiseAttendance: Object.values(subjectStats),
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

  // recalculate session stats

  const sessionRecords = await Attendance.find({
    session: attendanceRecord.session,
  });

  let totalPresent = 0;
  let totalAbsent = 0;
  for (const record of sessionRecords) {
    if (record.status === "present" || record.status === "late") {
      totalPresent++;
    } else {
      totalAbsent++;
    }
  }

  await AttendanceSession.findByIdAndUpdate(attendanceRecord.session, {
    totalPresent,
    totalAbsent,
  });

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

  for (const item of records) {
    const attendanceRecord = await AttendanceRecord.findById(item.recordId);

    if (!attendanceRecord) {
      continue;
    }

    attendanceRecord.status = item.status;
    attendanceRecord.remarks = item.remarks || "";
    attendanceRecord.markedBy = req.user._id;

    await attendanceRecord.save();
  }

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

  await attendanceRecord.deleteOne();

  //recalculate totals
  const records = await AttendanceRecord.find({
    session: sessionId,
  });

  let totalPresent = 0;
  let totalAbsent = 0;

  for (const record of records) {
    if (record.status === "present" || record.status === "late") {
      totalPresent++;
    } else {
      totalAbsent++;
    }
  }
  await AttendanceSession.findByIDAndUpdate(sessionId, {
    totalPresent,
    totalAbsent,
  });

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
