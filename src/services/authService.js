// services/authService.js
import User from "../models/userModel.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { uploadOnSupabase } from "../utils/fileUpload.js";
export const registerUserService = async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Validate input fields
  if (!name || !email || !phone || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ phone }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or phone already exists");
  }

  // Default avatar
  const avatarUrl = "https://cdn-icons-png.flaticon.com/128/1144/1144760.png";

  // Create new user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    avatar: avatarUrl,
  });

  // Fetch the created user without sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return createdUser;
};

// Token Generator
export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

// Login Service
export const loginUserService = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and Password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Update isLoggedIn to true
  user.isLoggedIn = true;
  await user.save();

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Cookie Options
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

  return loggedInUser;
};

// Logout Service
export const logoutUserService = async (userId) => {
  // Unset the refreshToken and set isLoggedIn to false
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1,
      },
      $set: {
        isLoggedIn: false,
      },
    },
    { new: true }
  );
};

// refreshAccessTokenService
export const refreshAccessTokenService = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return { accessToken, newRefreshToken };
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
};

/**
here change password come in future , i leave for now 
**/

// update account details

export const updateAccountDetailsService = async (req) => {
  const { name, phone, gender, bio } = req.body;

  if (!name && !phone && !gender && !bio) {
    throw new ApiError(400, "At least one field is required to update");
  }

  if (phone) {
    const existingUser = await User.findOne({ phone });
    if (
      existingUser &&
      existingUser._id.toString() !== req.user?._id.toString()
    ) {
      throw new ApiError(409, "Phone number is already in use by another user");
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(bio && { bio }),
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return updatedUser;
};

// upload image

export const updateUserAvatarService = async (userId, avatarLocalPath) => {
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Upload new avatar to Supabase
  const avatarUrl = await uploadOnSupabase(avatarLocalPath, "avatars");

  if (!avatarUrl) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { avatar: avatarUrl } },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};
