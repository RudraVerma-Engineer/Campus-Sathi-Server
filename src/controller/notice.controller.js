import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { Notice } from "../models/notice.model.js";
import { AppError } from "../utils/AppError.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

//create a notice
export const createNotice = asyncHandler(async (req, res) => {
  let approvalStatus = "approved";

  //student notice required approval
  if (req.user.role === "student") {
    approvalStatus = "pending";
  }

  const uploadedFiles = await uploadToCloudinary(req.files, "campus-notices");

  const notice = await Notice.create({
    ...req.body,
    createdBy: req.user._id,
    approvalStatus,
    attachments: uploadedFiles,
  });

  return res.status(201).json({
    success: true,
    message:
      req.user.role === "student"
        ? "Notice submitted for approval"
        : "Notice created successfully",
    notice,
  });
});

// get all notices
export const getAllNotices = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const skip = (page - 1) * limit;
  // using filter for enhancement

  const filter = { isDeleted: false };

  // filter for students
  if (req.user?.role === "student") {
    filter.approvalStatus = "approved";
  }

  // department filter

  if (req.query.department) {
    filter.department = {
      $in: [req.query.department],
    };
  }

  //semester filter
  if (req.query.semester) {
    filter.semester = {
      $in: [Number(req.query.semester)],
    };
  }

  //priority Filter
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }
  //search
  // if (req.query.search) {
  //   filter.$or = [
  //     {
  //       title: {
  //         $regex: req.query.search,
  //         $options: "i",
  //       },
  //     },
  //     {
  //       description: {
  //         $regex: req.query.search,
  //         $options: "i",
  //       },
  //     },
  //   ];
  // }

  filter.$text = {
    $search: req.query.search,
  };

  //Expired Notice Filter

  filter.$and = [
    {
      $or: [
        {
          expiresAt: {
            $exists: false,
          },
        },
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            $gt: new Date(),
          },
        },
      ],
    },
  ];

  //query

  const notices = await Notice.find(filter)
    .populate("createdBy", "fullname username role")
    .sort({
      isPinned: -1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit);
  const totalNotices = await Notice.countDocuments(filter);

  return res.status(200).json({
    success: true,
    totalNotices,
    currentPage: page,
    totalPages: Math.ceil(totalNotices / limit),
    notices,
  });
});

// get single Notice

export const getSingleNotice = asyncHandler(async (req, res) => {
  const { noticeId } = req.params;
  const notice = await Notice.findById(noticeId).populate(
    "createdBy",
    "fullname username role profilePhoto",
  );

  if (!notice) {
    throw new AppError(404, "Notice not Found");
  }

  if (notice.isDeleted) {
    throw new AppError(404, "Notice not found");
  }

  notice.views += 1;

  await notice.save();

  return res.status(200).json({
    success: true,
    notice,
  });
});

// update notice

export const updateNotice = asyncHandler(async (req, res) => {
  const { noticeId } = req.params;

  const notice = await Notice.findById(noticeId);

  if (!notice) {
    throw new AppError(404, "Notice not found");
  }

  // ownership / role check

  const isOwner = notice.createdBy.toString() === req.user._id.toString();

  const isAdmin = ["admin", "superAdmin"].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You are not allowed to update this notice");
  }

  // check approval to edit for student
  if (notice.approvalStatus === "approved" && req.user.role === "student") {
    throw new AppError(400, "Approved notice cannot be edited");
  }

  // update

  const updatedNotice = await Notice.findByIdAndUpdate(noticeId, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    message: "Notice updated successfully",
    notice: updatedNotice,
  });
});

// delete notice

export const deleteNotice = asyncHandler(async (req, res) => {
  const { noticeId } = req.params;

  const notice = await Notice.findById(noticeId);
  if (!notice) {
    throw new AppError(404, "Notice not found");
  }

  //ownership / role check

  const isOwner = notice.createdBy.toString() === req.user._id.toString();
  const isAdmin = ["admin", "faculty", "superAdmin"].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You are not allowed to delete this notice");
  }

  if (notice.isDeleted) {
    throw new AppError(400, "Notice already deleted");
  }

  notice.isDeleted = true;

  await notice.save();

  return res.status(200).json({
    success: true,

    message: "Notice deleted successfully",
  });
});

// restore notice
export const restoreNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.noticeId);
  if (!notice) {
    throw new AppError(404, "Notice not found");
  }

  if (!notice.isDeleted) {
    throw new AppError(400, "Notice is not deleted");
  }

  notice.isDeleted = false;
  await notice.save();

  return res.status(200).json({
    success: true,
    message: "Notice restored successfully",
    notice,
  });
});

// permanently delete notice
export const permanentlyDeleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.noticeId);
  if (!notice) {
    throw new AppError(404, "Notice not found");
  }

  const failedFiles = await deleteFromCloudinary(notice.attachments);

  await notice.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Notice permanently deleted",
    failedFiles,
  });
});

export const getMyNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find({
    createdBy: req.user._id,
  }).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    notices,
  });
});

export const getPendingNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find({
    approvalStatus: "pending",
  })
    .populate("createdBy", "fullname username profilePhoto")
    .sort({
      createdAt: -1,
    });

  return res.status(200).json({
    success: true,
    total: notices.length,
    notices,
  });
});

// export const approveNotice = asyncHandler(async (req, res) => {
//   const { noticeId } = req.params;
//   const notice = await Notice.findById(noticeId);
//   if (!notice) {
//     throw new AppError(404, "Notice not found");
//   }

//   // prevent double approval

//   if (notice.approvalStatus === "approved") {
//     throw new AppError(400, "Notice already approved");
//   }

//   //Approve Notice

//   notice.approvalStatus = "approved";

//   notice.approvedBy = req.user._id;

//   notice.approvedAt = new Date();

//   await notice.save();

//   return res.status(200).json({
//     success: true,
//     message: "Notice approved successfully",
//     notice,
//   });
// });

export const moderateNotice = asyncHandler(async (req, res) => {
  const { noticeId } = req.params;
  const { status, rejectionReason } = req.body;

  // validate status

  const allowedStatus = ["approved", "rejected"];

  if (!allowedStatus.includes(status)) {
    throw new AppError(400, "Invalid moderation status");
  }
  // find notice

  const notice = await Notice.findById(noticeId);

  if (!notice) {
    throw new AppError(404, "Notice not found");
  }

  // prevent duplicate moderation

  if (notice.approvalStatus === status) {
    throw new AppError(400, `Notice already ${status}`);
  }

  if (status === "rejected" && !rejectionReason) {
    throw new AppError(400, "Rejection reason required");
  }

  // update status

  notice.approvalStatus = status;

  if (status === "approved") {
    notice.approvedBy = req.user._id;

    notice.approvedAt = new Date();

    //clear rejection data

    notice.rejectedBy = undefined;

    notice.rejectedAt = undefined;
    notice.rejectionReason = "";
  }

  if (status === "rejected") {
    notice.rejectedBy = req.user._id;

    notice.rejectedAt = new Date();

    notice.rejectionReason = rejectionReason;

    // clear approval data

    notice.approvedBy = undefined;

    notice.approvedAt = undefined;
  }

  await notice.save();

  return res.status(200).json({
    success: true,
    message: `Notice ${status} successfully`,
    notice,
  });
});

// mark Notice as read
export const markNoticeAsRead = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.noticeId);

  if (!notice) {
    throw new AppError(404, "Notice not found");
  }

  const alreadyRead = notice.readBy.some(
    (item) => item.user.toString === req.user._id.toString(),
  );

  if(!alreadyRead){
    notice.readBy.push({
      user:req.user._id,
    });

    await notice.save();
  }

  return res.status(200).json({
    success:true,
    message:"Notice marked as read"
  });
});


