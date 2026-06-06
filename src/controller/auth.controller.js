import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import { sendEmail } from "../utils/sendEmail.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
// register user
export const registerUser = asyncHandler(async (req, res) => {
  const {
    fullname,
    username,
    email,
    password,
    phone,
    rollNumber,
    course,
    department,
    semester,
    section,
    batchYear,
  } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }, { rollNumber }],
  });

  if (existingUser) {
    throw new AppError(409, "User already exists");
  }

  let profilePhotoUrl;
  if (req.file) {
    const uploadedFiles = await uploadToCloudinary(
      [req.file],
      "campus-sathi/profile-images",
    );

    profilePhotoUrl = uploadedFiles[0]?.url;
  }
  //create user

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    phone,
    rollNumber,
    course,
    department,
    semester,
    section,
    batchYear,
    // always default
    role: "student",

    profilePhoto: profilePhotoUrl,
  });

  // generate Token

  const token = user.generateAuthToken();

  // cookiees adding

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  };
  //generating otp
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpiresAt = Date.now() + 10 * 60 * 1000;

  await user.save({
    validateBeforeSave: false,
  });

  await sendEmail(
    user.email,
    "Campus Sathi Verification Otp",
    `Your OTP is: ${otp}`,
  );

  // remove sensitive data
  const createdUser = await User.findById(user.id);

  //response

  return res.status(201).cookie("token", token, cookieOptions).json({
    success: true,
    message: "User registered successfully",

    token,
    user: createdUser,
  });
});

// login user

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //find user

  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user) {
    throw new AppError(404, "Invalid email or password");
  }

  //compare password

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError(401, "Invalid email or password");
  }

  //check account status
  if (user.accountStatus !== "active") {
    throw new AppError(403, `Account is ${user.accountStatus}`);
  }

  // check the user is verified or not
  if (!user.isVerified) {
    throw new AppError(403, "Please verify your account first");
  }

  // generate JWT token

  const token = user.generateAuthToken();

  //cookie adding
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  };

  user.lastSeen = Date.now();
  user.isOnline = true;

  await user.save({
    validateBeforeSave: false,
  });

  //remove sensitive Fields

  user.password = undefined;

  // response

  return res.status(200).cookie("token", token, cookieOptions).json({
    success: true,
    message: "Login successfully",
    token,
    user: user,
  });
});

// logout user

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    isOnline: false,
    lastSeen: Date.now(),
  });

  return res
    .status(200)
    .clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    .json({
      success: true,
      message: "Logout successful",
    });
});

// get current user profile

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    user,
  });
});

// update profile

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "fullname",
    "phone",
    "bio",
    "skills",
    "interests",
    "subjects",
    "semester",
    "section",
    "currentCGPA",
    "aiPreferences",
    "notificationSettings",
    "allowNotifications",
    "profilePhoto",
    "coverPhoto",
  ];

  const filteredBody = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      filteredBody[field] = req.body[field];
    }
  });

  if (Object.keys(filteredBody).length === 0) {
    throw new AppError(400, "No valid field provided for update");
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new AppError(404, " User not found");
  }

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

// verifying otp

export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
  }).select("+otp");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.otp !== otp) {
    throw new AppError(400, "Invalid OTP");
  }
  if (user.otpExpiresAt < Date.now()) {
    throw new AppError(400, "OTP expired");
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;

  await user.save({
    validateBeforeSave: false,
  });

  return res.status(200).json({
    success: true,
    message: "Account verified Successfully",
  });
});

//create faculty
export const createFaculty = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({
    email: req.body.email,
  });

  if (existingUser) {
    throw new AppError(409, "User already exists");
  }

  const faculty = await User.create({
    ...req.body,
    role: "faculty",
    isVerified: true,
  });
  return res.status(201).json({
    success: true,
    message: "Faculty created Successfully",
    faculty,
  });
});

//create admin

export const createAdmin = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    throw new AppError(409, "User already exist");
  }

  const admin = await User.create({
    ...req.body,
    role: "admin",
    isVerified: true,
  });
  return res.status(201).json({
    success: true,
    message: "Admin created successfully",
    admin,
  });
});
