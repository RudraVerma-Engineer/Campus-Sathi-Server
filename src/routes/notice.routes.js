import express from "express";
import {
  createNotice,
  deleteNotice,
  getAllNotices,
  getMyNotices,
  getPendingNotices,
  getSingleNotice,
  markNoticeAsRead,
  moderateNotice,
  permanentlyDeleteNotice,
  restoreNotice,
  updateNotice,
} from "../controller/notice.controller.js";

import {
  createNoticeValidationSchema,
  moderateNoticeSchema,
  updateNoticeValidationSchema,
} from "../validations/notice.validation.js";

import { validationMiddlewareFactory } from "../middlewares/validationMiddlewareFactory.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

//public

router.get("/", authMiddleware, getAllNotices);
router.get("/:noticeId", getSingleNotice);

//protected

//create a notice routes

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("student", "admin", "faculty", "superAdmin"),
  upload.array("attachments", 5),
  validationMiddlewareFactory(createNoticeValidationSchema),
  createNotice,
);

// update a notice routes

router.patch(
  "/update/:noticeId",
  authMiddleware,
  upload.array("attachments", 5),
  validationMiddlewareFactory(updateNoticeValidationSchema),
  updateNotice,
);

// soft delete a notice routes

router.patch("/delete/:noticeId", authMiddleware, deleteNotice);

//notice approval
router.patch(
  "/:noticeId/moderate",
  authMiddleware,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(moderateNoticeSchema),
  moderateNotice,
);

// get my notices

router.get("/my-notices", authMiddleware, getMyNotices);

// get pending notices
router.get(
  "/pending",
  authMiddleware,
  authorizeRoles("faculty", "admin", "superAdmin"),
  getPendingNotices,
);

// restore notice
router.patch("/restore/:noticeId", authMiddleware, restoreNotice);

// permanently delete a notice
router.delete(
  "/permanent/:noticeId",
  authMiddleware,
  authorizeRoles("admin", "superAdmin"),
  permanentlyDeleteNotice,
);

//mark the notice views

router.post("/read/:noticeId", authMiddleware, markNoticeAsRead);

export default router;
