import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { Section } from "../models/section.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import { getStudentSection } from "../utils/enrollSection.js";

export const createSection = asyncHandler(async (req, res) => {
  const section = await Section.create(req.body);
  res.status(201).json({ success: true, message: "Section created", section });
});

export const getAllSections = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.semester) filter.semester = Number(req.query.semester);

  const sections = await Section.find(filter)
    .select("-students")
    .sort({ department: 1, semester: 1, name: 1 })
    .lean();

  // cheap student count without shipping the id arrays
  const counts = await Section.aggregate([
    { $match: filter },
    { $project: { n: { $size: "$students" } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [c._id.toString(), c.n]));

  res.status(200).json({
    success: true,
    count: sections.length,
    sections: sections.map((s) => ({ ...s, studentCount: map[s._id] ?? 0 })),
  });
});

export const getMySection = asyncHandler(async (req, res) => {
  const section = await getStudentSection(req.user._id);
  res.status(200).json({ success: true, section: section || null });
});

export const getSingleSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.sectionId).populate(
    "students",
    "fullname rollNumber email profilePhoto",
  );
  if (!section) throw new AppError(404, "Section not found");
  res.status(200).json({ success: true, section });
});

export const addStudentsToSection = asyncHandler(async (req, res) => {
  const { studentIds = [] } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new AppError(400, "studentIds is required");
  }
  const students = await User.find({
    _id: { $in: studentIds },
    role: "student",
  }).select("_id");

  const section = await Section.findByIdAndUpdate(
    req.params.sectionId,
    { $addToSet: { students: { $each: students.map((s) => s._id) } } },
    { new: true },
  );
  if (!section) throw new AppError(404, "Section not found");

  res.status(200).json({
    success: true,
    message: `${students.length} student(s) added`,
    totalStudents: section.students.length,
  });
});

export const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findByIdAndDelete(req.params.sectionId);
  if (!section) throw new AppError(404, "Section not found");
  res.status(200).json({ success: true, message: "Section deleted" });
});
