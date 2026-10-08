import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 5000 },
    link: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    marks: { type: Number, min: 0 },
    feedback: { type: String, trim: true, maxlength: 1000 },
    gradedAt: { type: Date },
  },
  { _id: false },
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 4000 },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, required: true },
    maxMarks: { type: Number, default: 10, min: 1 },
    attachmentLink: { type: String, trim: true },
    submissions: { type: [submissionSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

assignmentSchema.index({ section: 1, dueDate: 1 });
assignmentSchema.index({ faculty: 1, dueDate: -1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
