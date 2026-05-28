import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    timetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lectureType: {
      type: String,
      enum: ["lecture", "lab", "tutorial"],
      default: "lecture",
    },

    lectureDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    room:{
        type:String,
        trim:true,
    },
    building:{
        type:String,
        trim:true
    },

    status: {
      type: String,
      enum: ["scheduled", "active", "completed","cancelled"],
      default: "scheduled",
    },
    attendanceMode:{
        type:String,
        enum:["manual","qr","biometric"],
        default:"manual",
    },
    totalStudents:{
        type:Number,
        default:0,
    },
    totalPresent:{
        type:Number,
        default:0,
    },
    totalAbsent:{
        type:Number,
        default:0,
    },
    remarks:{
        type:String,
        trim:true,
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    sessionNumber:{
        type:Number,
    }
  },
  {
    timestamps: true,
  },
);

//indexes

attendanceSessionSchema.index({
  lectureDate: 1,
});

attendanceSessionSchema.index({
  faculty: 1,
  lectureDate: 1,
});

attendanceSessionSchema.index({
  subject: 1,
});

attendanceSessionSchema.index({
  department: 1,
  semester: 1,
  section: 1,
});

//duplicate session 
attendanceSessionSchema.index(
  {
    timetable: 1,
    lectureDate: 1,
    startTime: 1,
  },
  {
    unique: true,
  },
);


export const AttendanceSession = mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema,
);
