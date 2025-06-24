import Otp from "../models/OTPModel.js";
import User from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import { sendResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteCache } from "../utils/nodeCache.js";

const isNITJSREmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@nitjsr\.ac\.in$/.test(email);

// ✅ Send OTP
export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.user;
  const user = req.user;

  if (user.isUploaderVerified == true && user.role == "uploader") {
    throw new ApiError(400, "User already verified");
  }
  console.log(email);
  if (!isNITJSREmail(email)) {
    throw new ApiError(400, "Only NITJSR emails are allowed.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await Otp.findOneAndUpdate(
    { email },
    { otp, expiresAt: otpExpiry },
    { upsert: true, new: true }
  );

  await sendEmail(email, `${otp}`);

  return sendResponse(res, 200, null, "OTP sent successfully");
});

// ✅ Verify OTP
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email } = req.user;
  const { otp } = req.body;

  const otpRecord = await Otp.findOne({ email });
  if (!otpRecord) {
    throw new ApiError(400, "OTP not found. Please request again.");
  }

  if (otpRecord.otp !== otp) {
    throw new ApiError(400, "Invalid OTP.");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, "OTP expired.");
  }

  const user = await User.findOneAndUpdate(
    { email },
    { isUploaderVerified: true, role: "uploader" }
  );
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  // Invalidate cache after successful update
  deleteCache(`user:${req.user._id}`);

  await Otp.deleteOne({ email }); // Clean OTP

  return sendResponse(res, 200, null, "Email verified successfully.");
});
