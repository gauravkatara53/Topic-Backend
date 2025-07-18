// controllers/auth.controller.js
import User from "../models/userModel.js";
import {
  registerUserService,
  loginUserService,
  logoutUserService,
  refreshAccessTokenService,
  updateAccountDetailsService,
  updateUserAvatarService,
  generateAccessAndRefreshTokens,
} from "../services/authService.js";
import { ApiResponse, sendResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCache, setCache } from "../utils/nodeCache.js";
import { deleteCache } from "../utils/nodeCache.js";
import dotenv from "dotenv";
dotenv.config();
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerUser = async (req, res, next) => {
  try {
    const newUser = await registerUserService(req, res);
    return sendResponse(res, 201, newUser, "User registered successfully");
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const user = await loginUserService(req, res);
    return sendResponse(res, 200, user, "User logged in successfully");
  } catch (error) {
    next(error);
  }
};

// logout User

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId; // Support both normal and Google users

  if (userId) {
    await logoutUserService(userId); // Call the service to clear refreshToken if available
  }

  // Cookie options (should be the same as login)
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // True in production, false in dev
    sameSite: "Lax", // For cross-site cookies (frontend and backend on different domains)
    path: "/", // Available for the entire site
  };

  // Clear both tokens from cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// refresh token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    res.status(400);
    throw new Error("Refresh token is required");
  }

  const { accessToken, newRefreshToken } =
    await refreshAccessTokenService(incomingRefreshToken);

  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed successfully"
      )
    );
});

// update user data
export const updateAccountDetailsController = asyncHandler(async (req, res) => {
  const updatedUser = await updateAccountDetailsService(req);

  // Invalidate cache after successful update
  deleteCache(`user:${req.user._id}`);

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Account details updated successfully")
    );
});

// upload avatar
export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  const userId = req.user?._id;

  const user = await updateUserAvatarService(userId, avatarLocalPath);

  // Invalidate cache after successful avatar update
  deleteCache(`user:${userId}`);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

// current user
export const getUser = asyncHandler(async (req, res) => {
  const cacheKey = `user:${req.user._id}`;

  // Check cache first
  let cachedUser = getCache(cacheKey);

  if (cachedUser) {
    console.log("Fetching user from cache");
    return res
      .status(200)
      .json(
        new ApiResponse(200, cachedUser, "User fetched successfully (cached)")
      );
  }

  console.log("Fetching user from request (DB verified user)");

  // User already attached to req.user in verifyJWT middleware
  const user = req.user;

  // Cache the user for future requests
  setCache(cacheKey, user);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

// google auth
export const googleLoginSuccess = async (req, res) => {
  const user = req.user;

  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication failed" });
  }

  // Update isLoggedIn to true
  user.isLoggedIn = true;
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Set cookies
  res.cookie("accessToken", accessToken, options);
  res.cookie("refreshToken", refreshToken, options);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Redirect to frontend with token and username
  return res.redirect(
    `${
      process.env.FRONTEND_URL
    }/google-success?token=${accessToken}&name=${encodeURIComponent(
      loggedInUser.name
    )}`
  );
};

// save google oauth

export const saveToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  console.log("----------------------------------------");
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token missing google auth " });
  }
  console.log("----------------------------------------");
  console.log(token);
  console.log("----------------------------------------");

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ success: true });
});

export const verifyGoogleToken = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists, else create
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, profilePic: picture });
    }

    user.isLoggedIn = true;
    await user.save();

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    res.status(200).json({ user: safeUser });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid Google token",
      error: err.message,
    });
  }
};

// GET usr ID
export const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const cacheKey = `user:${userId}`;

  // Check cache first
  const cachedUser = getCache(cacheKey);

  if (cachedUser) {
    console.log("Fetching user by ID from cache");
    return res
      .status(200)
      .json(
        new ApiResponse(200, cachedUser, "User fetched successfully (cached)")
      );
  }

  // Fetch from DB
  const user = await User.findById(userId).select("-password"); // remove password if needed

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  // Cache the result
  setCache(cacheKey, user);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});
