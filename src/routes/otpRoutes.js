import { Router } from "express";

import { verifyJWT } from "../middlewares/authMiddleware.js";
import { sendOtp, verifyOtp } from "../controllers/otpController.js";

const router = Router();

router.route("/send-otp").post(verifyJWT, sendOtp);
router.route("/verify-otp").post(verifyJWT, verifyOtp);

export default router;
