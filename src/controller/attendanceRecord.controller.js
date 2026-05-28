import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { AttendanceRecord } from "../models/attendanceRecord.model.js";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { AppError } from "../utils/AppError.js";

//mark single attendance

export const markAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const { student, status, remarks } = req.body;

  const session = await AttendanceSession.findById(sessionId);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  const alreadyMarked = await AttendanceRecord.findOne({
    session: sessionId,
    student,
  });

  if (alreadyMarked) {
    throw new AppError(400, "Attendance already marked");
  }

  const record = await AttendanceRecord.create({
    session: sessionId,
    student,
    status,
    remarks,
    markedBy: req.user._id,
  });

  // statistics update
  if (status === "present" || "late") {
    session.totalPresent += 1;
  } else {
    session.totalAbsent += 1;
  }

  await session.save();

  return res.status(201).json({
    success: true,
    message: "Attendance marked successfully",
    record,
  });
});

// bulk attendance

export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const { records } = req.body;

  const session = await AttendanceSession.findById(sessionId);

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  let totalPresent = 0;

  let totalAbsent = 0;
  const insertedRecords = [];

  for (const item of records) {
    const exists = await AttendanceRecord.findOne({
      session: sessionId,
      student: item.student,
    });

    if (exists) {
      continue;
    }

    const record = await AttendanceRecord.create({
      session: sessionId,
      student: item.student,
      status: item.status,
      remarks: item.remarks,
      markedBy: req.user._id,
    });

    insertedRecords.push(record);

    if(item.status ==="present" || item.status ==="late"){
        totalPresent++;
    }else{
        totalAbsent++;
    }
  }

  session.totalPresent += totalPresent;

  session.totalAbsent +=totalAbsent;

  await session.save();

  return res.status(201).json({
    success:true,
    message:"Bulk attendance marked successfully",

    totalInserted : insertedRecords.length,
    records: insertedRecords,
  });
});


//get session attendance
export const getSessionAttendance = asyncHandler(async (req,res)=>{
    const records = await AttendanceRecord.find({
        session:req.params.sessionId,
    })
    .populate("student","fullname rollNumber")
    .populate("markedBy","fullname");

    return res.status(200).json({
        success:true,
        count :records.length,
        records,
    });
});


// get student attendance

export const getStudentAttendance = asyncHandler(async (req,res)=>{
    const records = await AttendanceRecord.find({
        student: req.params.studentId,
    }).populate({
        path:"session",
        populate:{
            path:"subject",

            select:
            "name code",
        },
    });

    return res.status(200).json({
        success: true,
        count : records.length,
        records,
    })
});


// update attendance 

export const updateAttendance = asyncHandler( async (req,res)=>{
    const { recordId } = req.params;

    const record = await AttendanceRecord.findById(recordId);

    if(!record){
        throw new AppError(404,"Attendance record not found");
    }

    record.status = req.body.status || record.status;
    record.remarks = req.body.remarks || record.remarks;

    await record.save();
    return res.status(200).json({
        success:true,
        message:"Attendance updated successfully",
        record
    })
})