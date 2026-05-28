import Joi from "joi";

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
});

export const moderateNoticeSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
});
