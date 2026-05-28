import mongoose from "mongoose";
import dayEnum from "../constants/dayEnum.js";

const days = dayEnum;
const timetableSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    lectureType: {
      type: String,
      enum: ["lecture", "lab"],
      default: "lecture",
    },
    day: {
      type: String,
      enum: days,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

//indexes
timetableSchema.index({
  section: 1,
  day: 1,
});

timetableSchema.index({
  faculty: 1,
  day: 1,
});
timetableSchema.index(
  {
    section: 1,
    day: 1,
    startTime: 1,
  },
  {
    unique: true,
  },
);

//time validation
timetableSchema.pre("validate", function (next) {
  const start = this.startTime.split(":");
  const end = this.endTime.split(":");

  const startMinutes = Number(start[0]) * 60 + Number(start[1]);

  const endMinutes = Number(end[0]) * 60 + Number(end[1]);

  if (endMinutes <= startMinutes) {
    return next(new Error("End time must be after start time"));
  }
  next();
});

export const Timetable = mongoose.model("Timetable", timetableSchema);
