import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { AttendanceRecord } from "../models/attendanceRecord.model.js";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { Section } from "../models/section.model.js";
import { AppError } from "../utils/AppError.js";

//create attendance Session
export const createAttendanceSession = asyncHandler(async (req, res) => {
  const {
    timetable,
    section,
    subject,
    faculty,
    department,
    semester,
    lectureType,
    lectureDate,
    startTime,
    endTime,
    room,
    building,
    attendanceMode,
    remarks,
    sessionNumber,
  } = req.body;

  const sectionExists = await Section.findById(section);

  if (!sectionExists) {
    throw new AppError(404, "Section not found");
  }

  // duplicate session check
  const existingSession = await AttendanceSession.findone({
    timetable,
    lectureDate,
    startTime,
  });

  if (existingSession) {
    throw new AppError(409, "Attendance session already exists");
  }

  //create session

  const attendanceSession = await AttendanceSession.create({
    timetable,
    section,
    subject,
    faculty,
    department,
    semester,
    lectureType,
    lectureDate,
    startTime,
    endTime,
    room,
    building,
    attendanceMode,
    remarks,
    sessionNumber,
    totalStudents: sectionExists.students.length,
    createdBy: req.user._id,
  });

  return res.status(201).json({
    success: true,

    message: "Attendance session created successfully",

    attendanceSession,
  });
});

// get all attendance sessions
export const getAllAttendanceSessions = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  const filter = {};

  //section filter
  if (req.query.section) {
    filter.section = req.query.section;
  }

  //subject filter
  if (req.query.subject) {
    filter.subject = req.query.subject;
  }

  // faculty filter
  if (req.query.faculty) {
    filter.faculty = req.query.faculty;
  }

  // status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // lecture date filter
  if (req.query.lectureDate) {
    filter.lectureDate = req.query.lectureDate;
  }

  const sessions = await AttendanceSession.find(filter)
    .populate("section", "name department semester")
    .populate("faculty", "fullname email")
    .sort({
      lectureDate: -1,
      startTime: -1,
    })
    .skip(skip)
    .limit(limit);

  const totalSessions = await AttendanceSession.countDocuments(filter);

  return res.status(200).json({
    success: true,
    currentPage: page,
    totalPages: Math.ceil(totalSessions / limit),
    totalSessions,
    sessions,
  });
});

// get single attendance session

export const getSingleAttendanceSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await AttendanceSession.findById(sessionId)
    .populate("section", "name department semester students")
    .populate("subject", "name code credits")
    .populate("faculty", "fullname email");

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }
  //attendance records

  const attendanceRecords = await AttendanceRecord.find({
    session: sessionId,
  }).populate("student", "fullname email rollNumber");

  return res.status(200).json({
    success: true,
    session,
    attendanceRecords,
  });
});

//update attendance session
export const updateAttendanceSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await AttendanceSession.findById(sessionId);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  // only creator / admin can update
  const isOwner = session.createdBy.toString() === req.user._id.toString();
  const isAdmin = ["admin", "superAdmin"].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You are not allowed to update this session");
  }

  const updatedSession = await AttendanceSession.findByIdAndUpdate(
    sessionId,
    {
      ...req.body,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    message: "Attendance session updated successfully",
    updatedSession,
  });
});

//delete attendance session
export const deleteAttendanceSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await AttendanceSession.findById(sessionId);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  //only creator/admin

  const isOwner = session.createdBy.toString() === req.user._id.toString();

  const isAdmin = ["admin", "superAdmin"].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "Yoou are not allowed to delete this session");
  }

  //delete session

  await session.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Attendance session deleted successfully",
  });
});
