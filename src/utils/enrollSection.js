import { Section } from "../models/section.model.js";

// A student's batch year is optional at signup, so derive a sensible one.
const deriveBatchYear = (user) =>
  user.batchYear ||
  new Date().getFullYear() - Math.floor(((user.semester || 1) - 1) / 2);

// Put a student into the matching Section (creating it on first use) so that
// timetable / attendance work without an admin hand-building sections.
export const enrollStudentInSection = async (user) => {
  if (!user.section || user.role !== "student") return null;

  const batchYear = deriveBatchYear(user);

  // leave any previous section first (semester/section may have changed)
  await Section.updateMany(
    {
      students: user._id,
      $or: [
        { name: { $ne: user.section } },
        { department: { $ne: user.department } },
        { semester: { $ne: user.semester } },
      ],
    },
    { $pull: { students: user._id } },
  );

  return Section.findOneAndUpdate(
    {
      name: user.section,
      department: user.department,
      semester: user.semester,
      batchYear,
    },
    { $addToSet: { students: user._id } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );
};

export const getStudentSection = (userId) =>
  Section.findOne({ students: userId });
