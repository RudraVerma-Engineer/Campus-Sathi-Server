import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { Company } from "../models/company.model.js";
import {
  PlacementDrive,
  APPLICATION_STATUS,
} from "../models/placementDrive.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";

/* ───────────── companies ───────────── */

export const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create({
    ...req.body,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, message: "Company created", company });
});

export const getCompanies = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };
  if (req.query.search) filter.$text = { $search: req.query.search };
  const companies = await Company.find(filter)
    .sort({ companyName: 1 })
    .limit(100);
  res.status(200).json({ success: true, count: companies.length, companies });
});

export const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOneAndUpdate(
    { _id: req.params.companyId, isDeleted: false },
    { ...req.body, updatedBy: req.user._id },
    { returnDocument: "after", runValidators: true },
  );
  if (!company) throw new AppError(404, "Company not found");
  res.status(200).json({ success: true, company });
});

export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.companyId, {
    isDeleted: true,
  });
  if (!company) throw new AppError(404, "Company not found");
  res.status(200).json({ success: true, message: "Company removed" });
});

/* ───────────── drives ───────────── */

const shapeDrive = (drive, user) => {
  const d = drive.toObject ? drive.toObject() : drive;
  const mine = (d.applications || []).find(
    (a) => a.student?.toString() === user._id.toString(),
  );
  const deadlinePassed = new Date(d.applicationDeadline) < new Date();
  const deptOk =
    !d.departments?.length || d.departments.includes(user.department);
  const cgpaOk = (user.currentCGPA || 0) >= (d.minCGPA || 0);
  const { applications, ...rest } = d;
  return {
    ...rest,
    applicantCount: applications?.length || 0,
    myStatus: mine?.status || null,
    deadlinePassed,
    isEligible: deptOk && cgpaOk,
    ineligibleReason: !deptOk
      ? "Not open for your department"
      : !cgpaOk
        ? `Minimum CGPA ${d.minCGPA} required`
        : null,
  };
};

export const createDrive = asyncHandler(async (req, res) => {
  const company = await Company.findOne({
    _id: req.body.company,
    isDeleted: false,
  });
  if (!company) throw new AppError(404, "Company not found");
  const drive = await PlacementDrive.create({
    ...req.body,
    createdBy: req.user._id,
  });
  await Company.findByIdAndUpdate(company._id, { $inc: { totalDrives: 1 } });
  res
    .status(201)
    .json({ success: true, message: "Placement drive created", drive });
});

export const getDrives = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.mine === "true") filter["applications.student"] = req.user._id;

  const drives = await PlacementDrive.find(filter)
    .populate("company", "companyName industry companyType location logo")
    .sort({ applicationDeadline: 1 })
    .limit(100);

  let shaped = drives.map((d) => shapeDrive(d, req.user));
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    shaped = shaped.filter(
      (d) =>
        d.role.toLowerCase().includes(q) ||
        d.company?.companyName?.toLowerCase().includes(q),
    );
  }
  res.status(200).json({ success: true, count: shaped.length, drives: shaped });
});

export const getDrive = asyncHandler(async (req, res) => {
  const drive = await PlacementDrive.findOne({
    _id: req.params.driveId,
    isDeleted: false,
  }).populate("company");
  if (!drive) throw new AppError(404, "Drive not found");
  res.status(200).json({ success: true, drive: shapeDrive(drive, req.user) });
});

export const applyToDrive = asyncHandler(async (req, res) => {
  const drive = await PlacementDrive.findOne({
    _id: req.params.driveId,
    isDeleted: false,
  });
  if (!drive) throw new AppError(404, "Drive not found");
  if (drive.status !== "open")
    throw new AppError(400, "Applications are closed");
  if (new Date() > drive.applicationDeadline)
    throw new AppError(400, "Deadline has passed");

  const info = shapeDrive(drive, req.user);
  if (!info.isEligible) throw new AppError(403, info.ineligibleReason);
  if (info.myStatus) throw new AppError(400, "You have already applied");

  drive.applications.push({ student: req.user._id });
  await drive.save();
  await Company.findByIdAndUpdate(drive.company, {
    $inc: { totalApplications: 1 },
  });
  res.status(200).json({ success: true, message: "Application submitted" });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!APPLICATION_STATUS.includes(status))
    throw new AppError(400, "Invalid status");

  const drive = await PlacementDrive.findById(req.params.driveId);
  if (!drive) throw new AppError(404, "Drive not found");
  const app = drive.applications.find(
    (a) => a.student.toString() === req.params.studentId,
  );
  if (!app) throw new AppError(404, "Application not found");

  const wasSelected = app.status === "selected";
  app.status = status;
  app.updatedAt = new Date();
  await drive.save();

  if (status === "selected" && !wasSelected) {
    await Company.findByIdAndUpdate(drive.company, {
      $inc: { totalSelections: 1 },
    });
  }
  res.status(200).json({ success: true, message: "Status updated" });
});

export const getDriveApplicants = asyncHandler(async (req, res) => {
  const drive = await PlacementDrive.findById(req.params.driveId).populate(
    "applications.student",
    "fullname rollNumber department currentCGPA email",
  );
  if (!drive) throw new AppError(404, "Drive not found");
  res.status(200).json({ success: true, applications: drive.applications });
});

/* Real numbers from the database (no hard-coded marketing stats). */
export const getPlacementStats = asyncHandler(async (req, res) => {
  const drives = await PlacementDrive.find({ isDeleted: false }).select(
    "packageLPA applications status",
  );

  const mine = { applied: 0, shortlisted: 0, interview: 0, offers: 0 };
  const selectedStudents = new Set();
  const packages = [];

  for (const d of drives) {
    for (const a of d.applications) {
      if (a.student.toString() === req.user._id.toString()) {
        mine.applied++;
        if (a.status === "shortlisted") mine.shortlisted++;
        if (a.status === "interview") mine.interview++;
        if (a.status === "selected") mine.offers++;
      }
      if (a.status === "selected") {
        selectedStudents.add(a.student.toString());
        packages.push(d.packageLPA);
      }
    }
  }

  const totalStudents = await User.countDocuments({
    role: "student",
    isVerified: true,
  });
  res.status(200).json({
    success: true,
    mine,
    overall: {
      openDrives: drives.filter((d) => d.status === "open").length,
      placedStudents: selectedStudents.size,
      placementRate: totalStudents
        ? Math.round((selectedStudents.size / totalStudents) * 100)
        : 0,
      averagePackage: packages.length
        ? Number(
            (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1),
          )
        : 0,
      highestPackage: packages.length ? Math.max(...packages) : 0,
    },
  });
});
