import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: true,
    },
    semester:{
        type:Number,
        required:true,
    },
    section:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Section"
    },

    faculty:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    credits: {
      type: Number,
      default: 4,
    },
    subjectType: {
      type: String,
      enum: ["theory", "lab", "both"],
      default: "theory",
    },
    isActive:{
        type:Boolean,
        default:true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

//indexes 
subjectSchema.index({
  department: 1,
  semester: 1,
  section: 1,
});
subjectSchema.index({
  faculty: 1,
});

export const Subject = mongoose.model("Subject", subjectSchema);
