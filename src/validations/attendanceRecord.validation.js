import Joi from "joi";

// mark single attendance
export const markAttendanceValidationSchema = Joi.object({
  records: Joi.array()
    .items(
      Joi.object({
        student: Joi.string().hex().length(24).required(),
        status: Joi.string()
          .valid("present", "absent", "late", "leave")
          .required(),
        remarks: Joi.string().trim().allow("", null),
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one attendance record is required",
    }),
});

//attendance summary query validation
export const attendanceSummaryValidationSchema = Joi.object({
  startDate: Joi.date(),

  endDate: Joi.date(),

  subject: Joi.string().hex().length(24),

  section: Joi.string().hex().length(24),
});

// update Attendance Record Validation Schema
export const updateAttendanceRecordValidationSchema = Joi.object({
  status: Joi.string().valid("present", "absent", "late", "leave").required(),

  remarks: Joi.string().trim().allow("", null),
});

// bulk update validation schema
export const bulkUpdateAttendanceValidationSchema = Joi.object({
  records: Joi.array()
    .items(
      Joi.object({
        recordId: Joi.string().hex().length(24).required(),
        status: Joi.string()
          .valid("present", "absent", "late", "leave")
          .required(),
        remarks: Joi.string().trim().allow("", null),
      }),
    )
    .min(1)
    .required(),
});

// bulk delete attendance validation schema

export const bulkDeleteAttendanceValidationSchema = Joi.object({
  recordIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
});
