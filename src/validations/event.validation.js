import Joi from "joi";

import departmentEnum from "../constants/departmentEnum.js";

const Departments = departmentEnum;

// create event validation
export const createEventValidationSchema = Joi.object({
  title: Joi.string().trim().min(5).max(120).required().messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 5 characters",
    "string.max": "Title cannot exceed 120 characters",
  }),
  description: Joi.string().trim().min(20).max(3000).required().messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 20 characters",
  }),
  organizedBy: Joi.string().trim().required().messages({
    "string.empty": "Organizer name is required",
  }),

  department: Joi.array()
    .items(Joi.string().valid(...Departments))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one department is required",
    }),

  targetAudience: Joi.string()
    .valid("students", "faculty", "everyone")
    .default("students"),

  eventType: Joi.string()
    .valid(
      "workshop",
      "seminar",
      "hackathon",
      "fest",
      "sports",
      "webinar",
      "competition",
      "other",
    )
    .required()
    .messages({
      "any.only": "Invalid event type",
    }),
  mode: Joi.string().valid("online", "offline", "hybrid").required().messages({
    "any.only": "Invalid event mode",
  }),

  venue: Joi.string().trim().allow("", null),

  meetingLink: Joi.string().uri().allow("", null).messages({
    "string.uri": "Meeting link must be a valid URL",
  }),
  startDate: Joi.date().required().messages({
    "date.base": "End date must be valid",
  }),
  endDate: Joi.date().required().messages({
    "date.base": "End date must be valid",
  }),

  registrationDeadline: Joi.date().required().messages({
    "date.base": "Registration deadline must be valid",
  }),
  maxParticipants: Joi.number().min(1).optional(),

  isPaid: Joi.boolean().default(false),

  fee: Joi.number().min(0).default(0),

  tags: Joi.array().items(Joi.string().trim().lowercase()),

  contactEmail: Joi.string().email().allow("", null),
  contactPhone: Joi.string().trim().allow("", null),
  certificateProvided: Joi.boolean(),
  location: Joi.object({
    address: Joi.string().allow("", null),
    building: Joi.string().allow("", null),
    room: Joi.string().allow("", null),
    coordinates: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number(),
    }),
  }),
})

  // custom validations
  .custom((value, helpers) => {
    if (value.mode === "online" && !value.meetingLink) {
      return helpers.message("Meeting link is required for online events");
    }

    if (value.mode === "offline" && !value.venue) {
      return helpers.message("Venue is required for offine events");
    }

    // paid event requires fee
    if (value.isPaid && (!value.fee || value.fee <= 0)) {
      return helpers.message("Fees must be greater than 0 for paid events");
    }

    // end date check

    if (new Date(value.endDate) <= new Date(value.startDate)) {
      return helpers.message("End date must be after start date");
    }

    // registration deadline check

    if (new Date(value.registrationDeadline) > new Date(value.startDate)) {
      return helpers.message(
        "Registration deadline cannot be after event start date",
      );
    }

    return value;
  });

// update event validation

export const updateEventValidationSchema = Joi.object({
  title: Joi.string().trim().min(5).max(120),
  description: Joi.string().trim().min(20).max(3000),
  organizedBy: Joi.string().trim(),
  department: Joi.array().items(Joi.string().valid(...Departments)),
  targetAudience: Joi.string().valid("students", "faculty", "everyone"),
  mode: Joi.string().valid("online", "offline", "hybrid"),
  venue: Joi.string().trim().allow("", null),
  meetingLink: Joi.string().uri().allow("", null),

  startDate: Joi.date(),
  endDate: Joi.date(),

  registrationDeadline: Joi.date(),
  maxParticipants: Joi.number().min(1),
  isPaid: Joi.boolean(),

  fee: Joi.number().min(0),
  tags: Joi.array().items(Joi.string().trim().lowercase()),
});

export const eventApprovalValidationSchema = Joi.object({
  approvalStatus: Joi.string()
    .valid("approved", "rejected")
    .required()
    .messages({
      "any.required": "Approval status is required",
      "any.only": "Approval status must be approved or rejected",
    }),
  rejectionReason: Joi.string()
    .trim()
    .allow("", null)
    .when("approvalStatus", {
      is: "rejected",
      then: Joi.string().trim().min(5).required().messages({
        "string.empty": "Rejection reason is required",
        "string.min": "Rejection reason must be at least 5 characters",
      }),
    }),
});
