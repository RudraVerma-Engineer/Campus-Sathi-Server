import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import departmentEnum from "../constants/departmentEnum.js";
import courseEnum from "../constants/courseEnum.js";

const Departments = departmentEnum;
const Course = courseEnum;

const userSchema = new mongoose.Schema(
  {
    fullname: {
      firstname: {
        type: String,
        minlength: 3,
        required: [true, "First Name Required"],
      },
      lastname: {
        type: String,
        minlength: 3,
      },
    },
    username: {
      type: String,
      minlength: 5,
      lowercase: true,
      trim: true,
      required: [true, "UserName required"],
      unique: [true, "Username must be unique"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/],
    },
    phone: {
      type: String,
      match: [/^\d{10}$/, "Phone must be 10 digits"],
    },
    password: {
      type: String,
      minlength: 8,
      required: true,
      select: false,
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    course: {
      type: String,
      enum: Course,
      required: true,
    },
    department: {
      type: String,
      enum: Departments,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 8,
    },
    section: {
      type: String,
      enum: ["A", "B", "C", "D"],
      trim: true,
    },
    batchYear: {
      type: Number,
    },
    currentCGPA: {
      type: Number,
      min: 0,
      max: 10,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["student", "admin", "faculty", "superAdmin"],
      default: "student",
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "blocked"],
      default: "active",
    },
    otp: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
    },
    profilePhoto: {
      type: String,
      default:
        "https://img.magnific.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80",
    },
    coverPhoto: {
      type: String,
      default:
        "https://i.pinimg.com/originals/c8/67/3a/c8673ad4c46ade00cf3bd0049db62b16.jpg",
    },
    bio: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    aiPreferences: {
      type: [String],
      default: [],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      trim: true,
    },
    notificationSettings: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      assignmentReminder: {
        type: Boolean,
        default: true,
      },
    },
    deviceTokens: [
      {
        type: String,
        trim: true,
      },
    ],
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedNotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notes",
      },
    ],
    subjects: [
      {
        type: String,
        trim: true,
      },
    ],
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    allowNotifications: {
      type: Boolean,
      default: true,
    },
    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// userSchema.index({ email: 1 });
// userSchema.index({ username: 1 });
// userSchema.index({ rollNumber: 1 });
userSchema.index({
  department: 1,
  semester: 1,
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    },
  );
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.virtual("fullName").get(function () {
  return `${this.fullname.firstname} ${this.fullname.lastname}`;
});

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.otp;

  return userObject;
};

export const User = mongoose.model("User", userSchema);
