import { AttendanceRecord } from "../models/attendanceRecord.model.js";
import { AttendanceSession } from "../models/attendanceSession.model.js";
import { User } from "../models/user.model.js";

const PRESENT = ["present", "late"];

// Recalculate present/absent counters of a session from its records.
export const syncSessionTotals = async (sessionId) => {
  const [present, absent] = await Promise.all([
    AttendanceRecord.countDocuments({
      session: sessionId,
      status: { $in: PRESENT },
    }),
    AttendanceRecord.countDocuments({
      session: sessionId,
      status: { $nin: PRESENT },
    }),
  ]);
  await AttendanceSession.findByIdAndUpdate(sessionId, {
    totalPresent: present,
    totalAbsent: absent,
  });
  return { present, absent };
};

// Keep the cached percentage on the user document in sync.
export const syncStudentPercentage = async (studentId) => {
  const [total, present] = await Promise.all([
    AttendanceRecord.countDocuments({ student: studentId }),
    AttendanceRecord.countDocuments({
      student: studentId,
      status: { $in: PRESENT },
    }),
  ]);
  const pct = total === 0 ? 0 : Math.round((present / total) * 10000) / 100;
  await User.findByIdAndUpdate(studentId, { attendancePercentage: pct });
  return pct;
};
