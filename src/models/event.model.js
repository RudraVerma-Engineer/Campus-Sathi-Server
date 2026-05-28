import mongoose from "mongoose";
import departmentEnum from "../constants/departmentEnum.js";

const Departments = departmentEnum;

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    registeredAt: {
      type: Date,
      default: Date.now,
    },

    attendanceMarked: {
      marked: {
        type: Boolean,
        default: false,
      },
      markedAt: {
        type: Date,
      },
      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    _id: false,
  },
);

//attachments schema

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    public_id: {
      type: String,
      required: true,
    },
    resource_type: {
      type: String,
      enum: ["image", "video", "raw"],
      required: true,
    },
    originalName: {
      type: String,
    },

    mimetype: {
      type: String,
    },
    size: {
      type: Number,
    },
  },
  {
    _id: false,
  },
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 3000,
    },
    poster: {
      type: String,
      default: null,
    },
    attachments: {
      type: [attachmentSchema],

      validate: {
        validator: function (arr) {
          return !arr || arr.length <= 10;
        },
        message: "Maximum 10 attachments allowed",
      },
    },

    organizedBy: {
      type: String,
      required: true,
      trim: true,
    },
    organizerRole: {
      type: String,
      enum: ["student", "faculty", "admin", "superAdmin"],
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    department: [
      {
        type: String,
        enum: Departments,
      },
    ],

    targetAudience: {
      type: String,
      enum: ["students", "faculty", "everyone"],
      default: "students",
    },

    eventType: {
      type: String,
      enum: [
        "workshop",
        "seminar",
        "hackathon",
        "fest",
        "sports",
        "webinar",
        "competition",
        "other",
      ],
      required: true,
    },

    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      required: true,
    },

    venue: {
      type: String,
      trim: true,
    },
    location: {
      address: {
        type: String,
        trim: true,
      },

      building: {
        type: String,
        trim: true,
      },

      room: {
        type: String,
        trim: true,
      },

      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    meetingLink: {
      type: String,
      trim: true,
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    registrationDeadline: {
      type: Date,
      required: true,
    },

    maxParticipants: {
      type: Number,
      min: 1,
    },

    participants: [participantSchema],

    isPaid: {
      type: Boolean,
      default: false,
    },

    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    certificateProvided: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    registrationCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  },
);

// participantSchema.index(
//   {
//     user: 1,
//   },
//   {
//     unique: true,
//   },
// );

eventSchema.virtual("calculatedStatus").get(function () {
  const now = new Date();

  if (now < this.startDate) {
    return "upcoming";
  }

  if (now >= this.startDate && now <= this.endDate) {
    return "ongoing";
  }

  return "completed";
});

eventSchema.pre("validate", function (next) {
  if (this.endDate < this.startDate) {
    return next(new Error("End date must be after start date"));
  }
  next();
});

eventSchema.pre("validate", function (next) {
  if (this.registrationDeadline > this.startDate) {
    return next(
      new Error("Registration deadline must be before event start date"),
    );
  }
  next();
});

eventSchema.index({
  title: "text",
  description: "text",
});

eventSchema.index({
  eventType: 1,
  status: 1,
  startDate: 1,
});

eventSchema.index({
  department: 1,
});

export const Event = mongoose.model("Event", eventSchema);
