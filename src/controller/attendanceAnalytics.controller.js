import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { AttendanceRecord } from "../models/attendanceRecord.model";
import { AttendanceSession } from "../models/attendanceSession.model";

// student overall attendance
export const getStudentOverallAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const totalClasses = await AttendanceRecord.countDocuments({
    student: studentId,
  });

  const totalPresent = await AttendanceRecord.countDocuments({
    student: studentId,
    status: {
      $in: ["present", "late"],
    },
  });

  const percentage =
    totalClasses === 0 ? 0 : ((totalPresent / totalClasses) * 100).toFixed(2);

  return res.status(200).json({
    success: true,

    totalClasses,

    totalPresent,

    totalAbsent: totalClasses - totalPresent,

    attendancePercentage: Number(percentage),
  });
});

//subject wise attendance

export const getSubjectWiseAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const records = await AttendanceRecord.find({
    student: studentId,
  }).populate({
    path: "session",
    populate: {
      path: "subject",
      select: "name code",
    },
  });

  const subjectMap = {};

  for (const record of records) {
    const subject = record.session.subject;

    if (!subject) {
      continue;
    }
    const key = subject._id.toString();

    if (!subjectMap[key]) {
      subjectMap[key] = {
        subjectName: subject.name,
        subjectCode: subject.code,

        totalClasses: 0,
        totalPresent: 0,
      };
    }

    subjectMap[key].totalClasses += 1;

    if (record.status === "present" || record.status === "late") {
      subjectMap[key].totalPresent += 1;
    }
  }

  const result = Object.values(subjectMap).map((item) => ({
    ...item,
    attendancePercentage: (
      (item.totalPresent / item.totalClasses) *
      100
    ).toFixed(2),
  }));

  return res.status(200).json({
    success: true,
    subjects: result,
  });
});

//defaulter list

export const getDefaulterStudents = asyncHandler(async (req, res) => {
  const threshold = Number(req.query.threshold) || 75;
  const records = await AttendanceRecord.aggregate([
    {
      $group: {
        _id: "$student",

        totalClasses: {
          $sum: {
            $cond: [
              {
                $in: ["$status", ["present", "late"]],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        totalClasses: 1,
        totalPresent: 1,
        attendancePercentage: {
          $multiply: [
            {
              $divide: ["$totalPresent", "$totalClasses"],
            },
            100,
          ],
        },
      },
    },
    {
      $match: {
        attendancePercentage: {
          $lt: threshold,
        },
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    threshold,
    defaulters: records,
  });
});

// Faculty dashboard stats

export const getFacultyAttendanceStats = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;

  const totalSessions = await AttendanceSession.countDocuments({
    faculty: facultyId,
  });

  const completedSessions = await AttendanceSession.countDocuments({
    faculty: facultyId,
    status: "completed",
  });

  const activeSessions = await AttendanceSession.countDocuments({
    faculty: facultyId,
    status: "active",
  });

  return res.status(200).json({
    success: true,
    totalSessions,
    completedSessions,
    activeSessions,
  });
});
