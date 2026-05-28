import express from "express";

import { authUser } from "../middlewares/auth.middleware.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import {
  approveOrRejectEvent,
  createEvent,
  getAllEvents,
  getEventAttendance,
  getMyEvents,
  getSingleEvent,
  markAttendance,
  permanentlyDeleteEvent,
  registerForEvent,
  restoreEvent,
  updateEvent,
} from "../controller/event.controller.js";
import {
  createEventValidationSchema,
  eventApprovalValidationSchema,
  updateEventValidationSchema,
} from "../validations/event.validation.js";

const router = express.Router();

//create event routes
router.post(
  "/create",
  authUser,
  upload.array("attachments", 10),
  validationMiddlewareFactory(createEventValidationSchema),
  createEvent,
);

//get All events

router.get("/", authUser, getAllEvents);

// get my events

router.get("/my-events", authUser, getMyEvents);

//get single event

router.get("/:eventId", authUser, getSingleEvent);

//update event routes
router.patch(
  "/:eventId",
  authUser,
  upload.array("attachments", 10),
  validationMiddlewareFactory(updateEventValidationSchema),
  updateEvent,
);

//softDelete event

router.delete("/:eventId", authUser, deleteEvent);

// restore event
router.patch("/restore/:eventId", authUser, restoreEvent);

//permanent Delete event

router.delete(
  "/permanent/:eventId",
  authUser,
  authorizeRoles("admin", "superAdmin"),
  permanentlyDeleteEvent,
);

//register for event

router.post("/register/:event", authUser, registerForEvent);

// approve / reject event

router.patch(
  "/approve/:eventId",
  authUser,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(eventApprovalValidationSchema),
  approveOrRejectEvent,
);

//mark attendance

router.patch(
  "/attendance/:eventId",
  authUser,
  authorizeRoles("student", "faculty", "admin", "superAdmin"),
  markAttendance,
);

//get event attendance
router.get("/attendance/:eventId", authUser, getEventAttendance);

export default router;
