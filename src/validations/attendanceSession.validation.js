import Joi from "joi";

export const createAttendanceSessionValidation = Joi.object({
  timetable: Joi.string().required(),

  section: Joi.string().required(),

  subject: Joi.string().required(),

  faculty: Joi.string().required(),

  department: Joi.string().required(),

  semester: Joi.number().required(),

  lectureType: Joi.string()
    .valid("lecture", "lab", "tutorial")
    .default("lecture"),

  lectureDate: Joi.date().required(),

  startTime: Joi.string().required(),

  endTime: Joi.string().required(),

  room: Joi.string().trim().allow("", null),
  building: Joi.string().trim().allow("", null),

  attendanceMode: Joi.string()
    .valid("manual", "qr", "biometric")
    .default("manual"),

  remarks: Joi.string().trim().allow("", null),

  sessionNumber: Joi.number().min(1),
});

// update validation

export const updateAttendanceSessionValidationSchema = Joi.object({
  status: Joi.string().valid("scheduled", "active", "completed", "cancelled"),

  remarks: Joi.string().trim().allow("", null),
});
