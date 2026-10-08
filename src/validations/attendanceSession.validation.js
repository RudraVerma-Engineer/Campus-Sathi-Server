import Joi from "joi";

// export const createAttendanceSessionValidation = Joi.object({
//   timetable: Joi.string().required(),

//   section: Joi.string().required(),

//   subject: Joi.string().required(),

//   faculty: Joi.string().required(),

//   department: Joi.string().required(),

//   semester: Joi.number().required(),

//   lectureType: Joi.string()
//     .valid("lecture", "lab", "tutorial")
//     .default("lecture"),

//   lectureDate: Joi.date().required(),

//   startTime: Joi.string().required(),

//   endTime: Joi.string().required(),

//   room: Joi.string().trim().allow("", null),
//   building: Joi.string().trim().allow("", null),

//   attendanceMode: Joi.string()
//     .valid("manual", "qr", "biometric")
//     .default("manual"),

//   remarks: Joi.string().trim().allow("", null),

//   sessionNumber: Joi.number().min(1),
// });

// update validation

export const createAttendanceSessionValidationSchema = Joi.object({
  timetable: Joi.string().hex().length(24).required().messages({
    "string.empty": "Timetable id is required",
    "string.lenght": "Invalid timetable id",
  }),

  section: Joi.string().hex().length(24).required().messages({
    "string.empty": "Section id is required",
  }),

  subject: Joi.string().hex().length(24).required().messages({
    "string.empty": "Subject id is required",
  }),

  faculty: Joi.string().hex().length(24).required().messages({
    "string.empty": "Faculty id is required",
  }),

  department: Joi.string().trim().required().messages({
    "string.empty": "Department is required",
  }),

  semester: Joi.number().min(1).max(8).required().messages({
    "number.base": "Semester must be number",
  }),

  lectureType: Joi.string()
    .valid("lecture", "lab", "tutorial")
    .default("lecture"),

  lectureDate: Joi.date().required().messages({
    "date.base": "Lecture date must be valid",
  }),

  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.pattern.base": "Start time must be HH:mm format",
    }),

  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.pattern.base": "End time must be HH:mm format",
    }),

  room: Joi.string().trim().allow("", null),

  building: Joi.string().trim().allow("", null),

  attendanceMode: Joi.string()
    .valid("manual", "qr", "biometric")
    .default("manual"),

  remarks: Joi.string().trim().allow("", null),

  sessionNumber: Joi.number().min(1),
}).custom((value, helpers) => {
  //end time validation
  const start = value.startTime.split(":");

  const end = value.endTime.split(":");

  const startMinutes = Number(start[0]) * 60 + Number(start[1]);

  const endMinutes = Number(end[0]) * 60 + Number(end[1]);

  if (endMinutes <= startMinutes) {
    return helpers.message("End time must be after start time");
  }

  return value;
});

export const updateAttendanceSessionValidationSchema = Joi.object({
  status: Joi.string().valid("scheduled", "active", "completed", "cancelled"),
  attendanceMode: Joi.string().valid("manual", "qr", "biometric"),

  remarks: Joi.string().trim(),

  room: Joi.string().trim(),

  building: Joi.string().trim(),
});
