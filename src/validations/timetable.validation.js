import Joi from "joi";
import dayEnum from "../constants/dayEnum.js";

const days = dayEnum;
export const createTimetableValidationSchema = Joi.object({
  section: Joi.string().required(),

  subject: Joi.string().required(),

  faculty: Joi.string().required(),

  lectureType: Joi.string().valid("lecture", "lab").default("lecture"),

  day: Joi.string()
    .valid(...days)
    .required(),

  startTime: Joi.string().required(),

  endTime: Joi.string().required(),

  room: Joi.string().trim().allow("", null),

  building: Joi.string().trim().allow("", null),
}).custom((value, helpers) => {
  const start = value.startTime.split(":");
  const end = value.endTime.split(":");

  const startMinutes = Number(start[0]) * 60 + Number(start[1]);

  const endMinutes = Number(end[0]) * 60 + Number(end[1]);

  if (endMinutes <= startMinutes) {
    return helpers.message("End time must be after start time");
  }
  return value;
});

export const updateTimetableValidationSchema = Joi.object({
  section: Joi.string(),

  subject: Joi.string(),

  faculty: Joi.string(),

  lectureType: Joi.string().valid("lecture", "lab"),

  day: Joi.string().valid(...days),

  startTime: Joi.string(),

  endTime: Joi.string(),

  room: Joi.string().trim().allow("", null),

  building: Joi.string().trim().allow("", null),
  
  isActive: Joi.boolean(),
});
