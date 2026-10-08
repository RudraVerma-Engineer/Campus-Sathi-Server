import Joi from "joi";
import noticeCategoryEnum from "../constants/noticeCategoryEnum.js";

export const createNoticeValidationSchema = Joi.object({
  title: Joi.string().trim().max(120).required().messages({
    "string.empty": "Title is required",
  }),
  description: Joi.string().trim().max(5000).required().messages({
    "string.empty": "Description is required",
  }),
  department: Joi.array().items(Joi.string().trim()).optional(),
  semester: Joi.array().items(Joi.number().min(1).max(8)).optional(),
  priority: Joi.string().valid("low", "medium", "high").optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
  isPinned: Joi.boolean().optional(),
  expiresAt: Joi.date().optional(),
  targetAudience: Joi.string().valid("students", "faculty", "all").optional(),
  category: Joi.string().valid(...noticeCategoryEnum),
  pinnedUntil: Joi.date().optional(),
});

export const updateNoticeValidationSchema = Joi.object({
  title: Joi.string().trim().max(120),
  description: Joi.string().trim().max(5000),
  department: Joi.array().items(Joi.string().trim()),
  semester: Joi.array().items(Joi.number().min(1).max(8)),
  priority: Joi.string().valid("low", "medium", "high"),
  attachments: Joi.array().items(Joi.string()),
  isPinned: Joi.boolean(),
  expiresAt: Joi.date(),
  targetAudience: Joi.string().valid("students", "faculty", "all"),
  category: Joi.string().valid(...noticeCategoryEnum),
  pinnedUntil: Joi.date(),
});

export const moderateNoticeSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),

  rejectionReason: Joi.when("status", {
    is: "rejected",
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
});
