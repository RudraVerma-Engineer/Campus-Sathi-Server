import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { Timetable } from "../models/timetable.model.js";
import { AppError } from "../utils/AppError.js";

export const createTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.create({
    ...req.body,

    createdBy: req.user._id,
  });

  return res.status(201).json({
    success: true,
    message: "Timetable created successfully",
    timetable,
  });
});

// get all timetables

export const getAllTimeTables = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.section) {
    filter.section = req.query.section;
  }

  if (req.query.faculty) {
    filter.faculty = req.query.faculty;
  }
  if (req.query.day) {
    filter.day = req.query.day;
  }

  const timetables = await Timetable.find(filter)
    .populate("section", "name department semester")
    .populate("subject", "name code")
    .populate("faculty", "fullname email")
    .sort({
      day: 1,
      startTime: 1,
    });

  return res.status(200).json({
    success: true,
    count: timetables.length,
    timetables,
  });
});

//get single timetable

export const getSingleTimetable = async (req, res) => {
  const timetable = await Timetable.findById(req.params.timetableId)
    .populate("section", "name department semester")
    .populate("subject", "name code")
    .populate("faculty", "fullname email");

  if (!timetable) {
    throw new AppError(404, "Timetable not found");
  }

  return res.status(200).json({
    success: true,
    timetable,
  });
};

// update Timetable

export const updateTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findById(req.params.timetableId);

  if (!timetable) {
    throw new AppError(404, "Timetable not found");
  }

  const updatedTimetable = await Timetable.findByIdAndUpdate(
    req.params.timetableId,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    message: "Timetable updated successfully",
    timetable: updatedTimetable,
  });
});

// delete timetable

export const deleteTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findById(req.params.timetableId);

  if (!timetable) {
    throw new APpError(404, "Timtable not found");
  }

  await timetable.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Timetable deleted successfully",
  });
});

