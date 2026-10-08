import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { AttendanceRecord } from "../models/attendanceRecord.model.js";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { AppError } from "../utils/AppError.js";

const PRESENT = ["present", "late"];

const assertCanView = (req, studentId) => {
  if (req.user.role === "student" && req.user._id.toString() !== studentId) {
    throw new AppError(403, "You can only view your own attendance");
  }
};

// student overall attendance
export const getStudentOverallAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  assertCanView(req, studentId);

  const [totalClasses, totalPresent] = await Promise.all([
    AttendanceRecord.countDocuments({ student: studentId }),
    AttendanceRecord.countDocuments({
      student: studentId,
      status: { $in: PRESENT },
    }),
  ]);

  return res.status(200).json({
    success: true,
    totalClasses,
    totalPresent,
    totalAbsent: totalClasses - totalPresent,
    attendancePercentage: totalClasses
      ? Number(((totalPresent / totalClasses) * 100).toFixed(2))
      : 0,
  });
});

// subject wise attendance
export const getSubjectWiseAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  assertCanView(req, studentId);

  const records = await AttendanceRecord.find({ student: studentId }).populate({
    path: "session",
    populate: { path: "subject", select: "name code" },
  });

  const subjectMap = {};
  for (const record of records) {
    const subject = record.session?.subject;
    if (!subject) continue;
    const key = subject._id.toString();
    subjectMap[key] ||= {
      subjectId: key,
      subjectName: subject.name,
      subjectCode: subject.code,
      totalClasses: 0,
      totalPresent: 0,
    };
    subjectMap[key].totalClasses += 1;
    if (PRESENT.includes(record.status)) subjectMap[key].totalPresent += 1;
  }

  const result = Object.values(subjectMap).map((item) => ({
    ...item,
    attendancePercentage: Number(
      ((item.totalPresent / item.totalClasses) * 100).toFixed(2),
    ),
  }));

  return res.status(200).json({ success: true, subjects: result });
});

// defaulter list (below threshold, default 75%)
export const getDefaulterStudents = asyncHandler(async (req, res) => {
  const threshold = Number(req.query.threshold) || 75;

  const pipeline = [];
  if (req.query.section) {
    pipeline.push(
      {
        $lookup: {
          from: "attendancesessions",
          localField: "session",
          foreignField: "_id",
          as: "sess",
        },
      },
      { $unwind: "$sess" },
      {
        $match: {
          "sess.section": new mongoose.Types.ObjectId(req.query.section),
        },
      },
    );
  }

  pipeline.push(
    {
      $group: {
        _id: "$student",
        totalClasses: { $sum: 1 },
        totalPresent: {
          $sum: { $cond: [{ $in: ["$status", PRESENT] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        attendancePercentage: {
          $round: [
            { $multiply: [{ $divide: ["$totalPresent", "$totalClasses"] }, 100] },
            2,
          ],
        },
      },
    },
    { $match: { attendancePercentage: { $lt: threshold } } },
    { $sort: { attendancePercentage: 1 } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "student",
        pipeline: [
          { $project: { fullname: 1, rollNumber: 1, department: 1, section: 1 } },
        ],
      },
    },
    { $unwind: "$student" },
  );

  const defaulters = await AttendanceRecord.aggregate(pipeline);
  return res.status(200).json({ success: true, threshold, defaulters });
});

// Faculty dashboard stats
export const getFacultyAttendanceStats = asyncHandler(async (req, res) => {
  const faculty = req.user._id;
  const [totalSessions, completedSessions, activeSessions] = await Promise.all([
    AttendanceSession.countDocuments({ faculty }),
    AttendanceSession.countDocuments({ faculty, status: "completed" }),
    AttendanceSession.countDocuments({ faculty, status: "active" }),
  ]);
  return res.status(200).json({
    success: true,
    totalSessions,
    completedSessions,
    activeSessions,
  });
});
