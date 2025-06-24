import { Router } from "express";

import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  fetchAttendance,
  fillCollegeCredential,
} from "../controllers/collegeCredentialController.js";

const router = Router();

router.route("/fill/college").post(verifyJWT, fillCollegeCredential);
router.route("/get/attendance/data").post(verifyJWT, fetchAttendance);

export default router;
