import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase:true,
      trim:true,
    },

    department: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    batchYear: {
      type: Number,
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

sectionSchema.index(
  { name: 1, department: 1, semester: 1, batchYear: 1 },
  { unique: true },
);
sectionSchema.index({ students: 1 });

export const Section = mongoose.model("Section", sectionSchema);
