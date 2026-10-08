import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { Event } from "../models/event.model.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { AppError } from "../utils/AppError.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

// create event

export const createEvent = asyncHandler(async (req, res) => {
  // upload attachments
  let uploadedFiles = [];

  if (req.files && req.files.length > 0) {
    uploadedFiles = await uploadToCloudinary(req.files, "campus-events");
  }

  // set poster automatically

  const poster =
    uploadedFiles.find((file) => file.resource_type === "image")?.url || null;

  //approval logic

  let approvalStatus = "approved";

  if (req.user.role === "student") {
    approvalStatus = "pending";
  }
  //create event
  const event = await Event.create({
    ...req.body,
    poster,
    attachments: uploadedFiles,

    organizerRole: req.user.role,

    createdBy: req.user._id,

    approvalStatus,
  });

  return res.status(201).json({
    success: true,
    message:
      req.user.role === "student"
        ? "Event submitted for approval"
        : "Event created successfully",
    event,
  });
});

// get all events

export const getAllEvents = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: false,
  };

  // hide finished events unless a status is explicitly requested
  if (!req.query.status && req.query.includePast !== "true") {
    filter.endDate = { $gte: new Date() };
  }

  // student only see approved events
  if (req.user.role === "student") {
    filter.approvalStatus = "approved";
  }

  // department filter

  if (req.query.department) {
    filter.department = {
      $in: [req.query.department],
    };
  }

  // event type filter

  if (req.query.eventType) {
    filter.eventType = req.query.eventType;
  }

  //status filter

  if (req.query.status) {
    filter.status = req.query.status;
  }

  //mode filter

  if (req.query.mode) {
    filter.mode = req.query.mode;
  }

  // search filter
  if (req.query.search) {
    filter.$text = {
      $search: req.query.search,
    };
  }

  const events = await Event.find(filter)
    .populate("createdBy", "fullname username role profilePhoto")
    .sort({
      isFeatured: -1,
      startDate: 1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalEvents = await Event.countDocuments(filter);
  const uid = req.user._id.toString();

  // never leak the full participant list in the public list view
  const shaped = events.map(({ participants = [], ...e }) => ({
    ...e,
    isRegistered: participants.some((p) => p.user?.toString() === uid),
  }));

  return res.status(200).json({
    success: true,
    totalEvents,
    currentPage: page,
    totalPages: Math.ceil(totalEvents / limit),
    events: shaped,
  });
});

// get single event

export const getSingleEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId)
    .populate("createdBy", "fullname username role profilePhoto")
    .populate("participants.user", "fullname username profilePhoto");

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  if (event.isDeleted) {
    throw new AppError(404, "Event not found");
  }

  const uid = req.user._id.toString();
  const mine = event.participants.find(
    (p) => (p.user?._id || p.user).toString() === uid,
  );
  const isStaff = ["faculty", "admin", "superAdmin"].includes(req.user.role);
  const isOwner = event.createdBy?._id?.toString() === uid;

  const plain = event.toObject();
  // students only get the count, not who else registered
  if (!isStaff && !isOwner) plain.participants = [];

  return res.status(200).json({
    success: true,
    event: {
      ...plain,
      isRegistered: Boolean(mine),
      myAttendanceMarked: Boolean(mine?.attendanceMarked?.marked),
    },
  });
});

// update event

export const updateEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  //ownership / admin check

  const isOwner = event.createdBy.toString() === req.user._id.toString();

  const isAdmin = ["admin", "superAdmin"].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You are not allowed to update this event");
  }
  if (event.approvalStatus === "approved" && !isAdmin) {
    throw new AppError(400, "Approved event cannot be edited");
  }

  //upload new attachments

  let uploadedFiles = [];

  if (req.files && req.files.length > 0) {
    uploadedFiles = await uploadToCloudinary(req.files, "campus-events");
  }

  // auto poster update

  let poster = event.poster;

  const imageFile = uploadedFiles.find(
    (file) => file.resource_type === "image",
  );

  if (imageFile) {
    poster = imageFile.url;
  }

  //update event

  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    {
      ...req.body,
      poster,
      $push: {
        attachments: {
          $each: uploadedFiles,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    message: "Event updated successfully",
    event: updatedEvent,
  });
});

// delete event

export const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  //ownership / admin check
  const isOwner = event.createdBy.toString() === req.user._id.toString();

  const isAdmin = ["admin", "superAdmin"].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You are not allowed to delete this event");
  }

  if (event.isDeleted) {
    throw new AppError(400, "Event already deleted");
  }

  // soft delete
  event.isDeleted = true;
  await event.save();

  return res.status(200).json({
    success: true,
    message: "Event moved to recycle bin",
  });
});

//restore event

export const restoreEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  if (!event.isDeleted) {
    throw new AppError(400, "Event is not deleted");
  }

  // organizer/ admin check

  const isOwner = event.createdBy.toString() === req.user._id.toString();

  const isAdmin = ["admin", "superAdmin", "faculty"].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You are not allowed to mark attendance");
  }

  event.isDeleted = false;

  await event.save();

  return res.status(200).json({
    success: true,
    message: "Event restore successfully",
    event,
  });
});

export const permanentlyDeleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  //delete cloudinary files

  await deleteFromCloudinary(event.attachments);

  //permanentlty remove document

  await event.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Event peermanently deleted",
  });
});

// get my events

export const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({
    createdBy: req.user._id,
    isDeleted: false,
  }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    events,
  });
});

//register for event

export const registerForEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  // only approved events

  if (event.approvalStatus !== "approved") {
    throw new AppError(400, "This event is not approved yet");
  }

  // cancelled event check

  if (event.status === "cancelled") {
    throw new AppError(400, "This event is cancelled");
  }

  //registration deadline check

  if (new Date() > new Date(event.registrationDeadline)) {
    throw new AppError(400, "Registration deadline has passed");
  }

  // duplicate registration check

  const alreadyRegistered = event.participants.some(
    (participant) => participant.user.toString() === req.user._id.toString(),
  );

  if (alreadyRegistered) {
    throw new AppError(400, "You already registered for this event");
  }

  // max participant check
  if (
    event.maxParticipants &&
    event.participants.length >= event.maxParticipants
  ) {
    throw new AppError(400, "Event registration is full");
  }

  // register user

  event.participants.push({
    user: req.user._id,
  });

  //increment count

  event.registrationCount += 1;

  await event.save();
  return res.status(200).json({
    success: true,

    message: "Successfully registered for event",

    totalParticipants: event.registrationCount,
  });
});

//approve or reject event

export const approveOrRejectEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const { approvalStatus, rejectionReason } = req.body;

  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  // validation

  if (!["approved", "rejected"].includes(approvalStatus)) {
    throw new AppError(400, "Invalid approval status");
  }

  //rejection reason required
  if (approvalStatus === "rejected" && !rejectionReason) {
    throw new AppError(400, "Rejection reason is required");
  }

  // update event
  event.approvalStatus = approvalStatus;

  event.rejectionReason = rejectionReason || "";

  await event.save();

  return res.status(200).json({
    success: true,
    message: `Event ${approvalStatus} successfully`,
    event,
  });
});

export const markAttendance = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const { studentId } = req.body;

  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  // organizer/ admin check

  const isOwner = event.createdBy.toString() === req.user._id.toString();

  const isAdmin = ["admin", "superAdmin", "faculty"].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You are not allowed to mark attendance");
  }

  //find participant
  const participant = event.participants.find(
    (p) => p.user.toString() === studentId,
  );

  if (!participant) {
    throw new AppError(404, "Student is not registered for this event");
  }
  //already marked

  if (participant.attendanceMarked.marked) {
    throw new AppError(400, "Attendance already marked");
  }

  //mark attendance
  participant.attendanceMarked = {
    marked: true,
    markedAt: new Date(),
    markedBy: req.user._id,
  };

  await event.save();

  return res.status(200).json({
    success: true,
    message: "Attendance marked successfully",
  });
});

// get event attendance

export const getEventAttendance = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId)
    .populate("participants.user", "fullname username email profilePhoto")
    .populate("participants.attendanceMarked.markedBy", "fullname role");

  if (!event) {
    throw new AppError(404, "Event not found");
  }
  return res.status(200).json({
    success: true,
    totalParticipants: event.participants.length,
    attendanceList: event.participants,
  });
});

// cancel registration
export const cancelEventRegistration = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);

  if (!event || event.isDeleted) {
    throw new AppError(404, "Event not found");
  }

  if (new Date() >= new Date(event.startDate)) {
    throw new AppError(400, "Cannot cancel after the event has started");
  }

  const before = event.participants.length;
  event.participants = event.participants.filter(
    (p) => p.user.toString() !== req.user._id.toString(),
  );

  if (event.participants.length === before) {
    throw new AppError(400, "You are not registered for this event");
  }

  event.registrationCount = event.participants.length;
  await event.save();

  return res.status(200).json({
    success: true,
    message: "Registration cancelled",
    totalParticipants: event.registrationCount,
  });
});
