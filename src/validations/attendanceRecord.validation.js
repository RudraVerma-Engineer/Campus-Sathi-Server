import Joi from "joi";

// mark single attendance

export const markAttendanceValidationSchema = Joi.object({
  student: Joi.string().required(),
  status: Joi.string().valid("present", "absent", "late", "leave").required(),
  remarks: Joi.string().trim().allow("", null),
});

// bulk attendance validation

export const bulkAttendanceValidationSchema = Joi.object({
  record: Joi.array()
    .items(
      Joi.object({
        student: Joi.string().required(),
        status: Joi.string()
          .valid("present", "absent", "late", "leave")
          .required(),
        remarks: Joi.string().trim().allow("", null),
      }),
    )
    .min(1)
    .required(),
});
