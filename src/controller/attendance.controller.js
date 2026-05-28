import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { Section } from "../models/section.model.js";
import { AppError } from "../utils/AppError.js";

//create session
export const createAttendanceSession = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.body.section);

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  const session = await AttendanceSession.create({
    ...req.body,

    totalStudents: section.students.length,

    createdBy: req.user._id,
  });

  return res.status(201).json({
    success: true,
    message: "Attendance session created",

    session,
  });
});

//get all sessions

export const getAllAttendanceSessions = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.section) {
    filter.section = req.query.section;
  }

  if (req.query.subject) {
    filter.subject = req.query.subject;
  }

  if (req.query.faculty) {
    filter.faculty = req.query.faculty;
  }

  if (req.query.lectureDate) {
    filter.lectureDate = req.query.lectureDate;
  }

  const sessions = await AttendanceSession.find(filter)
    .populate("section", "name department semester")
    .populate("subject", "name code")
    .populate("faculty", "fullname")
    .sort({ lectureDate: -1 });

  return res.status(200).json({
    success: true,
    count: sessions.length,
    sessions,
  });
});

//get single session

export const getSingleAttendanceSession = asyncHandler(async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId)
    .populate("section", "name")
    .populate("subject", "name code")
    .populate("faculty", "fullname");

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  return res.status(200).json({
    success: true,

    session,
  });
});

//update session
export const updateAttendanceSession = asyncHandler(async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  const updatedSession = await AttendanceSession.findByIdAndUpdate(
    req.params.sessionId,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    message: "Session updated successfully",
    session: updatedSession,
  });
});

//delete session
export const deleteAttendanceSession = asyncHandler(async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  await session.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Attendance session deleted",
  });
});
