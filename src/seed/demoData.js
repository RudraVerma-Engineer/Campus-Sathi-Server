// Fills a DEVELOPMENT database with realistic sample data so every screen of
// the app has something to show.   Run:  npm run seed:demo
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Section } from "../models/section.model.js";
import { Subject } from "../models/subject.model.js";
import { Timetable } from "../models/timetable.model.js";
import { Notice } from "../models/notice.model.js";
import { Event } from "../models/event.model.js";
import { Company } from "../models/company.model.js";
import { PlacementDrive } from "../models/placementDrive.model.js";
import { Assignment } from "../models/assignment.model.js";
import { enrollStudentInSection } from "../utils/enrollSection.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed demo data in production");
  process.exit(1);
}

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const PASSWORD = process.env.DEMO_PASSWORD || "Demo@12345";

const upsertUser = async (data) => {
  const found = await User.findOne({ email: data.email });
  if (found) return found;
  return User.create({
    password: PASSWORD,
    isVerified: true,
    accountStatus: "active",
    ...data,
  });
};

try {
  await mongoose.connect(process.env.MONGO_URL);

  const admin = await upsertUser({
    fullname: { firstname: "Demo", lastname: "Admin" },
    username: "demoadmin",
    email: "admin@demo.campussathi.com",
    phone: "9000000001",
    rollNumber: "ADM001",
    course: "BTech",
    department: "CSE",
    semester: 8,
    section: "A",
    batchYear: 2022,
    role: "admin",
  });
  const faculty = await upsertUser({
    fullname: { firstname: "Anita", lastname: "Sharma" },
    username: "demofaculty",
    email: "faculty@demo.campussathi.com",
    phone: "9000000002",
    rollNumber: "FAC001",
    course: "BTech",
    department: "CSE",
    semester: 8,
    section: "A",
    batchYear: 2015,
    role: "faculty",
  });
  const student = await upsertUser({
    fullname: { firstname: "Raj", lastname: "Verma" },
    username: "demostudent",
    email: "student@demo.campussathi.com",
    phone: "9000000003",
    rollNumber: "21CSE045",
    course: "BTech",
    department: "CSE",
    semester: 6,
    section: "A",
    batchYear: 2023,
    role: "student",
    currentCGPA: 8.6,
    skills: ["React Native", "Node.js", "MongoDB"],
  });
  const section = await enrollStudentInSection(student);

  const subjectDefs = [
    ["Data Structures", "CS301"],
    ["Operating Systems", "CS302"],
    ["Database Systems", "CS303"],
    ["Computer Networks", "CS304"],
  ];
  const subjects = [];
  for (const [name, code] of subjectDefs) {
    subjects.push(
      (await Subject.findOne({ code })) ||
        (await Subject.create({
          name,
          code,
          department: "CSE",
          semester: 6,
          section: section._id,
          faculty: faculty._id,
          credits: 4,
          createdBy: admin._id,
        })),
    );
  }

  if ((await Timetable.countDocuments({ section: section._id })) === 0) {
    const plan = {
      Monday: ["09:00", "10:00", "11:00"],
      Tuesday: ["09:00", "10:00", "11:00"],
      Wednesday: ["09:00", "10:00", "11:00"],
      Thursday: ["09:00", "10:00", "11:00"],
      Friday: ["09:00", "10:00", "11:00"],
    };
    let i = 0;
    for (const [day, starts] of Object.entries(plan)) {
      for (const startTime of starts) {
        const [h] = startTime.split(":").map(Number);
        await Timetable.create({
          section: section._id,
          subject: subjects[i % subjects.length]._id,
          faculty: faculty._id,
          department: "CSE",
          semester: 6,
          lectureType: "lecture",
          day,
          startTime,
          endTime: `${String(h + 1).padStart(2, "0")}:00`,
          room: `LH-${101 + (i % 4)}`,
          building: "Main Block",
          createdBy: admin._id,
        });
        i++;
      }
    }
  }

  if ((await Notice.countDocuments()) === 0) {
    const mk = (title, description, category, priority) => ({
      title,
      description,
      category,
      priority,
      targetAudience: "all",
      approvalStatus: "approved",
      createdBy: faculty._id,
    });
    await Notice.insertMany([
      mk(
        "End-Sem Exam Schedule Released",
        "The end-semester examination timetable for all departments has been published. Check the exam cell page for the detailed schedule and seating plan.",
        "exam",
        "high",
      ),
      mk(
        "TCS CodeVita Registration Open",
        "Final round registrations close in 3 days. Eligible students: B.Tech 3rd and 4th year with CGPA of 7.0 or above.",
        "placement",
        "high",
      ),
      mk(
        "Library Hours Extended",
        "The central library will stay open 24x7 during the exam season, starting next Monday through the end of exams.",
        "administration",
        "medium",
      ),
      mk(
        "Scholarship Form Deadline",
        "Students applying for the merit scholarship must submit their forms to the accounts office before the deadline.",
        "scholarship",
        "medium",
      ),
    ]);
  }

  if ((await Event.countDocuments()) === 0) {
    const mk = (title, type, mode, venue, d, extra = {}) => ({
      title,
      description: `${title} - join us for an exciting day of learning, networking and fun with students from every department.`,
      organizedBy: "Tech Club",
      department: ["CSE"],
      targetAudience: "students",
      eventType: type,
      mode,
      venue,
      startDate: days(d),
      endDate: days(d + 1),
      registrationDeadline: days(d - 1),
      approvalStatus: "approved",
      status: "upcoming",
      createdBy: faculty._id,
      ...extra,
    });
    await Event.insertMany([
      mk("TechFest 2026", "fest", "offline", "Main Auditorium", 6),
      mk("24-Hour Hackathon", "hackathon", "offline", "Innovation Lab", 12, {
        maxParticipants: 120,
      }),
      mk("AI/ML Summit", "seminar", "hybrid", "Seminar Hall B", 20, {
        meetingLink: "https://meet.google.com/demo-room",
      }),
    ]);
  }

  if ((await PlacementDrive.countDocuments()) === 0) {
    const mkCo = async (companyName, industry, companyType) =>
      (await Company.findOne({ companyName })) ||
      Company.create({
        companyName,
        industry,
        companyType,
        createdBy: admin._id,
        description: `${companyName} campus recruitment`,
      });
    const google = await mkCo("Google", "Technology", "mnc");
    const flip = await mkCo("Flipkart", "E-commerce", "product");
    await PlacementDrive.insertMany([
      {
        company: google._id,
        role: "Software Engineer I",
        packageLPA: 45,
        minCGPA: 8,
        applicationDeadline: days(9),
        createdBy: admin._id,
      },
      {
        company: flip._id,
        role: "SDE-1",
        packageLPA: 28,
        minCGPA: 6.5,
        applicationDeadline: days(14),
        createdBy: admin._id,
      },
    ]);
  }

  if ((await Assignment.countDocuments()) === 0) {
    await Assignment.create({
      title: "Binary Search Tree Implementation",
      description:
        "Implement insert, delete and traversal for a BST and submit your repo link.",
      subject: subjects[0]._id,
      section: section._id,
      faculty: faculty._id,
      dueDate: days(4),
      maxMarks: 20,
    });
  }

  console.log(`\nDemo data ready. Password for all demo users: ${PASSWORD}`);
  console.log("  student : student@demo.campussathi.com");
  console.log("  faculty : faculty@demo.campussathi.com");
  console.log("  admin   : admin@demo.campussathi.com\n");
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
