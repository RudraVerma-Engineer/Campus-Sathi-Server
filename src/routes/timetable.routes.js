import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validationMiddlewareFactory } from "../middlewares/validationMiddlewareFactory.js";
import {
  createTimetableValidationSchema,
  updateTimetableValidationSchema,
} from "../validations/timetable.validation.js";
import {
  createTimetable,
  deleteTimetable,
  getAllTimeTables,
  getSingleTimetable,
  updateTimetable,
} from "../controller/timetable.controller.js";

const router = express.Router();

//create timetable

router.post(
  "/create",
  authUser,
  authorizeRoles("admin", "superAdmin", "faculty"),
  validationMiddlewareFactory(createTimetableValidationSchema),
  createTimetable,
);

// get all timetables

router.get("/", authUser, getAllTimeTables);

// get single timetable

router.get("/:timetableId", authUser, getSingleTimetable);

//update timetable
router.put(
  "/:timetableId",
  authUser,
  authorizeRoles("admin", "superAdmin", "faculty"),
  validationMiddlewareFactory(updateTimetableValidationSchema),
  updateTimetable,
);

// delete timetable

router.delete(
  "/:timetableId",
  authUser,
  authorizeRoles("admin", "superAdmin"),
  deleteTimetable,
);

export default router;
