import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { Subject } from "../models/subject.model.js";
import { AppError } from "../utils/AppError.js";

//create subject
export const createSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.create({
    ...req.body,
    createdBy: req.user._id,
  });

  return res.status(201).json({
    success: true,
    message: "Subject created successfully",
    subject,
  });
});

// get all subjects

export const getAllSubjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) {
    filter.department = req.query.department;
  }
  if (req.query.semester) {
    filter.semester = req.query.semester;
  }
  if (req.query.section) {
    filter.semester = req.query.section;
  }

  const subjects = await Subject.find(filter)
    .populate("faculty", "fullname email role")
    .populate("section", "name department semester")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: subjects.length,
    subjects,
  });
});

// get single subject
export const getSingleSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.subjectId)
    .populate("faculty", "fullname email role")
    .populate("section", "name department semester");

  if (!subject) {
    throw new AppError(404, "Subject not found");
  }

  return res.status(200).json({
    success: true,
    subject,
  });
});

//update subject

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.subjectId);
  if (!subject) {
    throw new AppError(404, "Subject not found");
  }

  const updatedSubject = await Subject.findByIdAndUpdate(
    req.params.subjectId,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success:true,
    message:"Subject updated successfully",
    subject:updatedSubject,
  })
});


// delete subject 
export const deleteSubject = asyncHandler(async ( req, res)={
    const subject = await Subject.findById(req.params.subjectId);
    if(!subject) {
        throw new AppError(404, "Subject not found");

        await subject.deleteOne();

        return res.status(200).json({
            success:true,
            message: "Subject deleted successfully",
            
        })
    }
})