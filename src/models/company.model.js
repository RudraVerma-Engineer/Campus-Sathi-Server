import mongoose from "mongoose";
import companyTypeEnum from "../constants/companyTypeEnum.js";

const companyLogoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    resource_type: {
      type: String,
      enum: ["image"],
      required: true,
    },
    originalName: {
      type: String,
    },
    mimetype: {
      type: String,
      enum: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    },
    size: {
      type: Number,
    },
  },
  {
    _id: false,
  },
);

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: "true",
      minlength: 2,
      maxlength: 150,
    },

    companyLogo: {
      type: companyLogoSchema,
      default: null,
    },
    website: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },

    companyType: {
      type: String,
      enum: companyTypeEnum,
      required: true,
    },

    hrName: {
      type: String,
      trim: true,
    },

    hrEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    hrPhone: {
      type: String,
      trim: true,
    },

    linkedinUrl: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },

    totalDrives: {
      type: Number,
      default: 0,
    },
    totalApplications: {
      type: Number,
      default: 0,
    },

    totalSelections: {
      type: Number,
      default: 0,
    },

    highestPackage: {
      type: Number,
      default: 0,
    },

    averagePackage: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

companySchema.index({
  companyName: "text",
  industry: "text",
  description: "text",
});

companySchema.index({
  companyType: 1,
});

companySchema.index({
  active: 1,
});

companySchema.index({
  isDeleted: 1,
});

companySchema.index({
  "location.city": 1,
  "location.country": 1,
});
