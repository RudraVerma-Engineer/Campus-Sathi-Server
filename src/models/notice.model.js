import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 5000,
    },
    department: [
      {
        type: String,
        trim: true,
      },
    ],

    semester: [
      {
        type: Number,
        min: 1,
        max: 8,
      },
    ],

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    attachments: [
      {
        url: String,

        public_id: String,

        resource_type: String,

        originalName: String,

        mimetype: String,

        size: Number,
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
    targetAudience: {
      type: String,
      enum: ["students", "faculty", "all"],
      default: "all",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

noticeSchema.index({
  department: 1,
});
noticeSchema.index({
  semester: 1,
});

noticeSchema.index({
  createdAt: -1,
});

export const Notice = mongoose.model("Notice", noticeSchema);
