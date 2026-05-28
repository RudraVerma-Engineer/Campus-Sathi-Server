import express from "express";
import {
  createNotice,
  deleteNotice,
  getAllNotices,
  getSingleNotice,
  moderateNotice,
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

router.get("/", getAllNotices);
router.get("/:noticeId", getSingleNotice);

//protected

//create a notice routes

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("student", "admin", "faculty", "superAdmin"),
  upload.array("attachments",5),
  validationMiddlewareFactory(createNoticeValidationSchema),
  createNotice,
);

// update a notice routes

router.patch(
  "/update/:noticeId",
  authMiddleware,
  validationMiddlewareFactory(updateNoticeValidationSchema),
  updateNotice,
);

// delete a notice routes

router.delete("/delete/:noticeId", authMiddleware, deleteNotice);

//notice approval
router.patch(
  "/:noticeId/moderate",
  authMiddleware,
  authorizeRoles("faculty", "admin", "superAdmin"),
  validationMiddlewareFactory(moderateNoticeSchema),
  moderateNotice,
);

export default router;
