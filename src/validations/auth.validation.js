import Joi from "joi";
import departmentEnum from "../constants/departmentEnum.js";
import courseEnum from "../constants/courseEnum.js";

const roles = ["student", "admin", "faculty", "superAdmin"];

const Departments = departmentEnum;
const Course = courseEnum;
const sections = ["A", "B", "C", "D"];

//register validation Schema

export const registerValidationSchema = Joi.object({
  fullname: Joi.object({
    firstname: Joi.string().min(3).trim().required().messages({
      "string.empty": "First name is required",
      "string.min": "First name must be at least 3 characters",
    }),

    lastname: Joi.string().min(3).trim().allow("", null).messages({
      "string.min": "Last name must be at least 3 characters",
    }),
  }).required(),
  username: Joi.string().min(5).trim().lowercase().required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 5 characters",
  }),

  email: Joi.string().email().trim().lowercase().required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Email is required",
  }),
  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
    }),

  rollNumber: Joi.string().trim().required().messages({
    "string.empty": "Roll number is required",
  }),
  course: Joi.string()
    .valid(...Course)
    .required()
    .messages({
      "string.empty": "Course is required",
    }),

  department: Joi.string()
    .valid(...Departments)
    .required()
    .messages({
      "string.empty": "Department is required",
    }),

  semester: Joi.number().strict().min(1).max(8).required().messages({
    "number.base": "Semester must be a number",
    "number.min": "Semester must be at least 1",
    "number.max": "Semester cannot exceed 8",
  }),
  section: Joi.string()
    .valid(...sections)
    .optional(),

  batchYear: Joi.number().optional(),
  role: Joi.string()
    .valid(...roles)
    .optional(),

  bio: Joi.string().trim().max(200).optional(),

  skills: Joi.array().items(Joi.string().trim()).optional(),

  interests: Joi.array().items(Joi.string().trim()).optional(),

  subjects: Joi.array().items(Joi.string().trim()).optional(),
}).unknown(true);

//login validation Schema

export const loginValidationSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Email is required",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
}).unknown(false);

// Update Profile Validation Schema

export const updateProfileValidationSchema = Joi.object({
  fullname: Joi.object({
    firstname: Joi.string().min(3).trim(),

    lastname: Joi.string().min(3).trim().allow("", null),
  }),

  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
    }),

  bio: Joi.string().trim().max(200),

  semester: Joi.number().min(1).max(8),
  section: Joi.string().valid(...sections),
  currentCGPA: Joi.number().min(0).max(10),

  skills: Joi.array().items(Joi.string().trim()),

  interests: Joi.array().items(Joi.string().trim()),

  subjects: Joi.array().items(Joi.string().trim()),

  aiPreferences: Joi.array().items(Joi.string().trim()),

  notificationSettings: Joi.object({
    email: Joi.boolean(),

    push: Joi.boolean(),

    assignmentReminder: Joi.boolean(),
  }),

  allowNotifications: Joi.boolean(),
}).unknown(false);

// validation for verifying OTP

export const verifyOTPvalidationSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});
