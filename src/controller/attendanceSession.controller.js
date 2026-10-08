import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { AttendanceRecord } from "../models/attendanceRecord.model.js";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { Section } from "../models/section.model.js";
import { AppError } from "../utils/AppError.js";
import { getStudentSection } from "../utils/enrollSection.js";
import { Timetable } from "../models/timetable.model.js";
import { User } from "../models/user.model.js";
import { campusMidnight, getCampusNow } from "../utils/istTime.js";

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
  const existingSession = await AttendanceSession.findOne({
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
    filter.faculty = req.query.faculty === "me" ? req.user._id : req.query.faculty;
  }

  // a student only sees sessions of the section they belong to
  if (req.user.role === "student") {
    const mine = await getStudentSection(req.user._id);
    filter.section = mine ? mine._id : null;
  }

  // ?date=YYYY-MM-DD -> whole campus day
  if (req.query.date) {
    const start = new Date(`${req.query.date}T00:00:00+05:30`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    filter.lectureDate = { $gte: start, $lt: end };
  }

  // status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // lecture date filter
  if (req.query.lectureDate && !filter.lectureDate) {
    filter.lectureDate = req.query.lectureDate;
  }

  const sessions = await AttendanceSession.find(filter)
    .populate("section", "name department semester")
    .populate("subject", "name code")
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
    .select("-qrToken")
    .populate("section", "name department semester students")
    .populate("subject", "name code credits")
    .populate("faculty", "fullname email");

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }
  //attendance records

  const recordFilter = { session: sessionId };
  // students may only see their own mark, never classmates'
  if (req.user.role === "student") recordFilter.student = req.user._id;
  const attendanceRecords = await AttendanceRecord.find(
    recordFilter,
  ).populate("student", "fullname email rollNumber");

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

// create (or reuse) today's session straight from a timetable slot
export const createSessionFromTimetable = asyncHandler(async (req, res) => {
  const slot = await Timetable.findById(req.params.timetableId);
  if (!slot) throw new AppError(404, "Timetable slot not found");

  const isOwner = slot.faculty.toString() === req.user._id.toString();
  const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
  if (!isOwner && !isAdmin) {
    throw new AppError(403, "This lecture is not assigned to you");
  }

  const lectureDate = campusMidnight();
  let session = await AttendanceSession.findOne({
    timetable: slot._id,
    lectureDate,
    startTime: slot.startTime,
  });
  let created = false;

  if (!session) {
    const section = await Section.findById(slot.section);
    session = await AttendanceSession.create({
      timetable: slot._id,
      section: slot.section,
      subject: slot.subject,
      faculty: slot.faculty,
      department: slot.department,
      semester: slot.semester,
      lectureType: slot.lectureType,
      lectureDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      building: slot.building,
      status: "active",
      totalStudents: section?.students.length || 0,
      createdBy: req.user._id,
    });
    created = true;
  }

  return res.status(created ? 201 : 200).json({
    success: true,
    message: created ? "Attendance session started" : "Session already exists",
    session,
  });
});

// roster = every student of the section + their current mark (manual marking UI)
export const getSessionRoster = asyncHandler(async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId)
    .select("-qrToken")
    .populate("subject", "name code")
    .populate("section", "name department semester students");
  if (!session) throw new AppError(404, "Attendance session not found");

  const students = await User.find({ _id: { $in: session.section.students } })
    .select("fullname rollNumber profilePhoto")
    .sort({ rollNumber: 1 })
    .lean();

  const records = await AttendanceRecord.find({ session: session._id }).lean();
  const byStudent = Object.fromEntries(
    records.map((r) => [r.student.toString(), r]),
  );

  const roster = students.map((st) => ({
    student: st,
    recordId: byStudent[st._id.toString()]?._id || null,
    status: byStudent[st._id.toString()]?.status || null,
  }));

  return res.status(200).json({
    success: true,
    session: { ...session.toObject(), section: { _id: session.section._id, name: session.section.name } },
    roster,
    today: getCampusNow().dateKey,
  });
});
