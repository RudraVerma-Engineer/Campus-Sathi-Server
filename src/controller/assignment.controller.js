import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { Assignment } from "../models/assignment.model.js";
import { AppError } from "../utils/AppError.js";
import { getStudentSection } from "../utils/enrollSection.js";

const shape = (a, user) => {
  const o = a.toObject ? a.toObject() : a;
  const { submissions = [], ...rest } = o;
  const mine = submissions.find(
    (s) => s.student.toString() === user._id.toString(),
  );
  const overdue = new Date(o.dueDate) < new Date();
  return {
    ...rest,
    submissionCount: submissions.length,
    mySubmission: mine || null,
    state: mine
      ? mine.marks !== undefined
        ? "graded"
        : "submitted"
      : overdue
        ? "overdue"
        : "pending",
  };
};

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.create({
    ...req.body,
    faculty: req.user._id,
  });
  res
    .status(201)
    .json({ success: true, message: "Assignment created", assignment });
});

export const getAssignments = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };
  if (req.user.role === "student") {
    const section = await getStudentSection(req.user._id);
    filter.section = section ? section._id : null;
  } else {
    filter.faculty = req.user._id;
  }
  const list = await Assignment.find(filter)
    .populate("subject", "name code")
    .populate("faculty", "fullname")
    .sort({ dueDate: 1 })
    .limit(100);
  res
    .status(200)
    .json({ success: true, assignments: list.map((a) => shape(a, req.user)) });
});

export const getAssignment = asyncHandler(async (req, res) => {
  const a = await Assignment.findOne({
    _id: req.params.assignmentId,
    isDeleted: false,
  })
    .populate("subject", "name code")
    .populate("faculty", "fullname")
    .populate("submissions.student", "fullname rollNumber");
  if (!a) throw new AppError(404, "Assignment not found");

  const out = shape(a, req.user);
  if (req.user.role !== "student") out.submissions = a.submissions;
  res.status(200).json({ success: true, assignment: out });
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const { text, link } = req.body;
  if (!text && !link)
    throw new AppError(400, "Add some text or a link to submit");

  const a = await Assignment.findOne({
    _id: req.params.assignmentId,
    isDeleted: false,
  });
  if (!a) throw new AppError(404, "Assignment not found");

  const section = await getStudentSection(req.user._id);
  if (!section || section._id.toString() !== a.section.toString()) {
    throw new AppError(403, "This assignment is not for your section");
  }

  const existing = a.submissions.find(
    (s) => s.student.toString() === req.user._id.toString(),
  );
  if (existing?.marks !== undefined)
    throw new AppError(400, "Already graded - cannot resubmit");

  const payload = {
    text,
    link,
    submittedAt: new Date(),
    isLate: new Date() > a.dueDate,
  };
  if (existing) Object.assign(existing, payload);
  else a.submissions.push({ student: req.user._id, ...payload });
  await a.save();

  res
    .status(200)
    .json({
      success: true,
      message: payload.isLate ? "Submitted (late)" : "Submitted",
    });
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const a = await Assignment.findById(req.params.assignmentId);
  if (!a) throw new AppError(404, "Assignment not found");
  if (
    a.faculty.toString() !== req.user._id.toString() &&
    !["admin", "superAdmin"].includes(req.user.role)
  ) {
    throw new AppError(403, "Not your assignment");
  }
  const sub = a.submissions.find(
    (s) => s.student.toString() === req.params.studentId,
  );
  if (!sub) throw new AppError(404, "Submission not found");

  const marks = Number(req.body.marks);
  if (Number.isNaN(marks) || marks < 0 || marks > a.maxMarks) {
    throw new AppError(400, `Marks must be between 0 and ${a.maxMarks}`);
  }
  sub.marks = marks;
  sub.feedback = req.body.feedback || "";
  sub.gradedAt = new Date();
  await a.save();
  res.status(200).json({ success: true, message: "Graded" });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const a = await Assignment.findById(req.params.assignmentId);
  if (!a) throw new AppError(404, "Assignment not found");
  if (
    a.faculty.toString() !== req.user._id.toString() &&
    !["admin", "superAdmin"].includes(req.user.role)
  ) {
    throw new AppError(403, "Not your assignment");
  }
  a.isDeleted = true;
  await a.save();
  res.status(200).json({ success: true, message: "Assignment deleted" });
});
