import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "leave"],
      default: "absent",
    },

    markedAt: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

attendanceRecordSchema.index(
  {
    session: 1,
    student: 1,
  },
  {
    unique: true,
  },
);

export const AttendanceRecord = mongoose.model(
  "AttendanceRecord",
  attendanceRecordSchema,
);
