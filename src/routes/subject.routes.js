import express from "express";
import { authorizeRoles } from "../middlewares/role.middleware";

import { authUser } from "../middlewares/auth.middleware.js";
import { validationMiddlewareFactory } from "../middlewares/validationMiddlewareFactory.js";
import { createSubjectValidationSchema } from "../validations/subject.validation.js";

import { createSubject } from "../controller/subject.controller.js";

const router = express.Router();

//create subject router
router.post(
  "/create",
  authUser,
  authorizeRoles("admin", "superAdmin", "faculty"),
  validationMiddlewareFactory(createSubjectValidationSchema),
  createSubject,
);
