import cron from "node-cron";

import { Timetable } from "../models/timetable.model.js";

import { AttendanceSession } from "../models/attendanceSession.model.js";

const getTodayDay = () => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[new Date().getDay()];
};

cron.schedule("* * * * *", async () => {
  console.log("Running attendance cron...");

  const now = new Date();

  const currentTime = now.toTimeString().slice(0, 5);
  const today = getTodayDay();

  // today's lectures
  const timetables = await Timetable.find({
    day: today,
    isActive: true,
  });

  for (const timetable of timetables) {
    //match current lecture time
    if (timetable.startTime === currentTime) {
      //prevent duplicate session
      const existingSession = await AttendanceSession.findOne({
        timetable: timetable._id,
        lectureDate: new Date().setHours(0, 0, 0, 0),
        startTime: timetable.startTime,
      });
      if (existingSession) {
        continue;
      }
      //create session

      await AttendanceSession.create({
        timetable: timetable._id,
        section: timetable.section,
        subject: timetable.subject,
        faculty: timetable.faculty,
        department: timetable.department,
        semester: timetable.semester,
        lectureDate: new Date(),
        startTime: timetable.startTime,
        endTime: timetable.endTimeat,
        room: timetable.room,
        building: timetable.building,
        status: "active",
        attendanceMode: "qr",
        createdBy: timetable.faculty,
      });
      console.log(`Attendance session created`);
    }
  }
});

cron.schedule("* * * * *", async () => {
  const now = new Date().toTimeString().slice(0, 5);
  await AttendanceSession.updateMany(
    {
      status: "active",
      endTime: {
        $lte: now,
      },
    },
    {
      $set: {
        status: "completed",
      },
    },
  );
});
