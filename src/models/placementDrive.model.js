import mongoose from "mongoose";
import departmentEnum from "../constants/departmentEnum.js";

export const APPLICATION_STATUS = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
];

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: APPLICATION_STATUS, default: "applied" },
    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const placementDriveSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 3000 },
    jobType: { type: String, enum: ["fulltime", "internship"], default: "fulltime" },
    packageLPA: { type: Number, min: 0, default: 0 },
    minCGPA: { type: Number, min: 0, max: 10, default: 0 },
    // empty = open to every department
    departments: { type: [{ type: String, enum: departmentEnum }], default: [] },
    location: { type: String, trim: true },
    applicationDeadline: { type: Date, required: true },
    driveDate: { type: Date },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    applications: { type: [applicationSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

placementDriveSchema.index({ status: 1, applicationDeadline: 1 });
placementDriveSchema.index({ "applications.student": 1 });

export const PlacementDrive = mongoose.model("PlacementDrive", placementDriveSchema);
