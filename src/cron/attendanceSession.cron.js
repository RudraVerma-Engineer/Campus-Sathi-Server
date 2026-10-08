import cron from "node-cron";
import { Timetable } from "../models/timetable.model.js";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { Section } from "../models/section.model.js";
import { campusMidnight, getCampusNow } from "../utils/istTime.js";

// Every minute: open a session for lectures that are starting right now.
const openStartingSessions = async () => {
  const { day, time } = getCampusNow();
  const slots = await Timetable.find({
    day,
    startTime: time,
    isActive: true,
  });

  for (const slot of slots) {
    const lectureDate = campusMidnight();
    const exists = await AttendanceSession.findOne({
      timetable: slot._id,
      lectureDate,
      startTime: slot.startTime,
    });
    if (exists) continue;

    const section = await Section.findById(slot.section).select("students");
    await AttendanceSession.create({
      timetable: slot._id,
      section: slot.section,
      subject: slot.subject,
      faculty: slot.faculty,
      department: slot.department,
      semester: slot.semester,
      lectureType: slot.lectureType,
      lectureDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      building: slot.building,
      status: "scheduled",
      attendanceMode: "manual",
      totalStudents: section?.students.length || 0,
      createdBy: slot.faculty,
    });
  }
};

// Every minute: sessions whose lecture has ended are closed.
const closeFinishedSessions = async () => {
  const { time, dateKey } = getCampusNow();
  const today = campusMidnight();

  await AttendanceSession.updateMany(
    {
      status: { $in: ["scheduled", "active"] },
      $or: [
        { lectureDate: { $lt: today } },
        { lectureDate: today, endTime: { $lte: time } },
      ],
    },
    { $set: { status: "completed", qrEnabled: false } },
  );
  return dateKey;
};

export const startAttendanceCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      await openStartingSessions();
      await closeFinishedSessions();
    } catch (err) {
      console.error("Attendance cron failed:", err.message);
    }
  });
  console.log("Attendance cron started");
};
