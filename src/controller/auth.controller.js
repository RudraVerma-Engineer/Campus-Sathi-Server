import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import { sendEmail } from "../utils/sendEmail.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { enrollStudentInSection } from "../utils/enrollSection.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000,
};

const makeOtp = () => crypto.randomInt(100000, 1000000).toString();
const hash = (v) => crypto.createHash("sha256").update(v).digest("hex");
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
    throw new AppError(
      409,
      existingUser.isVerified
        ? "User already exists"
        : "This account is registered but not verified. Open Sign in and tap Resend OTP.",
    );
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

  // OTP (valid 10 minutes)
  const otp = makeOtp();
  user.otp = otp;
  user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  await sendEmail(
    user.email,
    "Campus Sathi Verification OTP",
    `Your Campus Sathi verification OTP is: ${otp}. It expires in 10 minutes.`,
  );

  // no token yet - the account must be verified first
  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify the OTP sent to your email.",
    email: user.email,
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
    throw new AppError(401, "Invalid email or password");
  }

  if (!user.password) {
    throw new AppError(400, "This account uses Google sign-in");
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
    "profileVisibility",
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

  // semester/section may have changed -> keep section membership in sync
  if (filteredBody.semester !== undefined || filteredBody.section !== undefined) {
    await enrollStudentInSection(updatedUser);
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

  if (!user.otp || user.otp !== otp) {
    throw new AppError(400, "Invalid OTP");
  }
  if (!user.otpExpiresAt || user.otpExpiresAt < Date.now()) {
    throw new AppError(400, "OTP expired");
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;

  await user.save({
    validateBeforeSave: false,
  });

  // put the student into their section so timetable/attendance work at once
  await enrollStudentInSection(user);

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

// resend verification OTP
export const resendOTP = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // same answer whether or not the account exists (no user enumeration)
  const generic = {
    success: true,
    message: "If this account needs verification, a new OTP has been sent.",
  };
  if (!user || user.isVerified) return res.status(200).json(generic);

  if (user.otpExpiresAt && user.otpExpiresAt - Date.now() > 9 * 60 * 1000) {
    throw new AppError(429, "Please wait a minute before requesting another OTP");
  }

  const otp = makeOtp();
  user.otp = otp;
  user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  await sendEmail(
    user.email,
    "Campus Sathi Verification OTP",
    `Your Campus Sathi verification OTP is: ${otp}. It expires in 10 minutes.`,
  );
  return res.status(200).json(generic);
});

// forgot password -> email OTP
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const generic = {
    success: true,
    message: "If an account exists for this email, a reset OTP has been sent.",
  };
  if (!user || user.accountStatus !== "active") return res.status(200).json(generic);

  const otp = makeOtp();
  user.resetPasswordToken = hash(otp);
  user.resetPasswordExpiresAt = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  await sendEmail(
    user.email,
    "Campus Sathi password reset",
    `Your password reset OTP is: ${otp}. It expires in 10 minutes. If you did not ask for this, ignore this email.`,
  );
  return res.status(200).json(generic);
});

// reset password with OTP
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email }).select(
    "+resetPasswordToken +resetPasswordExpiresAt",
  );
  if (
    !user ||
    !user.resetPasswordToken ||
    user.resetPasswordToken !== hash(otp) ||
    user.resetPasswordExpiresAt < Date.now()
  ) {
    throw new AppError(400, "Invalid or expired OTP");
  }
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });
  return res.status(200).json({ success: true, message: "Password reset. You can sign in now." });
});

// change password (logged in)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");
  if (!user.password || !(await user.comparePassword(currentPassword))) {
    throw new AppError(401, "Current password is incorrect");
  }
  if (currentPassword === newPassword) {
    throw new AppError(400, "New password must be different");
  }
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save({ validateBeforeSave: false });

  // old tokens die, hand back a fresh one so this device stays signed in
  const token = user.generateAuthToken();
  return res
    .status(200)
    .cookie("token", token, cookieOptions)
    .json({ success: true, message: "Password changed", token });
});

// profile photo upload
export const updateProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, "Image file is required");
  const uploaded = await uploadToCloudinary(
    [req.file],
    "campus-sathi/profile-images",
  );
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePhoto: uploaded[0]?.url },
    { new: true },
  );
  return res.status(200).json({ success: true, message: "Photo updated", user });
});

// Google sign-in (verifies the ID token on the server)
export const googleLogin = asyncHandler(async (req, res) => {
  const audiences = [
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
  ].filter(Boolean);
  if (audiences.length === 0) {
    throw new AppError(501, "Google sign-in is not configured on the server");
  }

  let payload;
  try {
    const ticket = await new OAuth2Client().verifyIdToken({
      idToken: req.body.idToken,
      audience: audiences,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(401, "Invalid Google token");
  }
  if (!payload?.email_verified) {
    throw new AppError(401, "Google email is not verified");
  }

  let user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user) {
    // college details are missing -> the app sends the person to complete them
    return res.status(200).json({
      success: true,
      needsRegistration: true,
      google: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
      message: "No Campus Sathi account for this Google email. Please sign up first.",
    });
  }
  if (user.accountStatus !== "active") {
    throw new AppError(403, `Account is ${user.accountStatus}`);
  }
  if (!user.isVerified) {
    user.isVerified = true; // Google already verified the email
    await enrollStudentInSection(user);
  }
  user.lastSeen = Date.now();
  user.isOnline = true;
  await user.save({ validateBeforeSave: false });

  const token = user.generateAuthToken();
  return res.status(200).cookie("token", token, cookieOptions).json({
    success: true,
    message: "Login successfully",
    token,
    user,
  });
});

// register an FCM/Expo push token for this device
export const registerDeviceToken = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { fcmTokens: req.body.token },
  });
  return res.status(200).json({ success: true, message: "Device registered" });
});
