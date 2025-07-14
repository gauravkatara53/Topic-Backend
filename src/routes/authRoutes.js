import { Router } from "express";
import {
  getUser,
  getUserById,
  googleLoginSuccess,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  saveToken,
  updateAccountDetailsController,
  updateUserAvatar,
  verifyGoogleToken,
} from "../controllers/authController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";
import passport from "passport";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);

// 🔹 Google Auth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleLoginSuccess
);

router.route("/refreshToken").post(refreshAccessToken);

router.route("/update/data").put(verifyJWT, updateAccountDetailsController);
router.patch(
  "/update-avatar",
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar
);
router.route("/getUser").get(verifyJWT, getUser);
router.route("/getUser/:id").get(verifyJWT, getUserById);

//save token
router.route("/save-token").post(saveToken);
// google
// routes/auth.js

router.route("/google/verify").post(verifyGoogleToken);

export default router;
