import Joi from "joi";


//create subject validation schema 
export const createSubjectValidationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().uppercase().required(),
  department: Joi.string().trim().required(),
  semester: Joi.number().min(1).max(8).required(),
  section: Joi.string().required(),
  faculty: Joi.string().required(),
  credits: Joi.number().min(0).default(4),
  subjectType: Joi.string().valid("theory", "lab", "both").default("theory"),
});

// update subject validation

export const updateSubjectValidationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  code: Joi.string().trim().uppercase(),
  department: Joi.string().trim(),
  semester: Joi.number().min(1).max(8),
  section: Joi.string(),
  faculty: Joi.string(),
  credits: Joi.number().min(0),
  subjectType: Joi.string().valid("theory", "lab", "both"),
});