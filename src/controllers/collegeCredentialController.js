import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";

import { getCache, setCache } from "../utils/nodeCache.js"; // Adjust path if needed

// export const fillCollegeCredential = asyncHandler(async (req, res) => {
//   const { email } = req.user;

//   if (!email) {
//     throw new ApiError(401, "Unauthorized");
//   }

//   const { userId, password } = req.body;

//   if (!userId || !password) {
//     throw new ApiError(400, "User ID and Password are required");
//   }

//   // Hash the password
//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(password, salt);

//   const user = await User.findOneAndUpdate(
//     { email },
//     { collegeId: userId, collegePassword: hashedPassword },
//     { new: true }
//   );

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   // Remove refreshToken before sending response
//   const userObj = user.toObject();
//   delete userObj.refreshToken;

//   return sendResponse(
//     res,
//     200,
//     userObj,
//     "College credentials added successfully"
//   );
// });

//  add
import { deleteCache } from "../utils/nodeCache.js";

export const fillCollegeCredential = asyncHandler(async (req, res) => {
  const { email, _id } = req.user;

  if (!email) {
    throw new ApiError(401, "Unauthorized");
  }

  const { userId, password } = req.body;

  if (!userId || !password) {
    throw new ApiError(400, "User ID and Password are required");
  }

  // Find the user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isAttendancePortalConnected === true) {
    throw new ApiError(400, "Already connected");
  }

  user.collegeId = userId;
  user.collegePassword = password;
  user.isAttendancePortalConnected = true;

  await user.save();

  // Cache keys to delete
  const userCacheKey = `user:${_id}`;
  const attendanceCacheKey = `attendance_${userId}`;

  // Delete cache
  await deleteCache(userCacheKey);
  await deleteCache(attendanceCacheKey);

  return sendResponse(res, 200, user, "College credentials added successfully");
});

const HEADLESS = true; // Set to false for debugging with browser UI

// fetch the attendance

export const fetchAttendance = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user || !user.collegeId || !user.collegePassword) {
    throw new ApiError(401, "Unauthorized request: Missing credentials");
  }

  const { collegeId, collegePassword } = user;

  // 🧠 Try to serve from cache
  const cacheKey = `attendance_${collegeId}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log("💾 Attendance data served from cache");
    return sendResponse(res, 200, cachedData, "Attendance fetched from cache");
  }

  console.log("🔐 Starting Puppeteer");
  const isProduction = process.env.NODE_ENV === "production";
  const browser = await puppeteer.launch({
    args: isProduction ? chromium.args : ["--no-sandbox"],
    defaultViewport: chromium.defaultViewport,
    executablePath: isProduction ? await chromium.executablePath : undefined, // let Puppeteer pick default locally
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Go to login page
    console.log("🌐 Navigating to Login.aspx");
    await page.goto("https://online.nitjsr.ac.in/endsem/Login.aspx", {
      waitUntil: "networkidle2",
    });

    // Fill login
    console.log("✍️ Filling login form");
    await page.waitForSelector("#txtuser_id", { timeout: 10000 });
    await page.type("#txtuser_id", collegeId);

    await page.waitForSelector("#txtpassword", { timeout: 10000 });
    await page.type("#txtpassword", collegePassword);

    await Promise.all([
      page.click("#btnsubmit"),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // Check login
    const currentUrl = page.url();
    if (currentUrl.includes("Login.aspx")) {
      console.log("❌ Login failed");
      throw new ApiError(401, "Invalid college credentials");
    }

    // Navigate to attendance page
    console.log("📄 Navigating to attendance page");
    await page.goto(
      "https://online.nitjsr.ac.in/endsem/StudentAttendance/ClassAttendance.aspx",
      { waitUntil: "networkidle2" }
    );

    console.log("⏳ Waiting for attendance table");
    await page.waitForSelector("#ContentPlaceHolder1_gv", { timeout: 10000 });

    // Scrape attendance
    console.log("🔍 Scraping table data");
    const tableData = await page.$$eval("#ContentPlaceHolder1_gv tr", (rows) =>
      rows.map((row) =>
        Array.from(row.querySelectorAll("th, td")).map((cell) =>
          cell.innerText.trim()
        )
      )
    );

    await browser.close();

    console.log("✅ Scraped:", tableData.length, "rows");

    // 🧠 Store in cache for 6 hours (21600 sec)
    setCache(cacheKey, tableData, 6 * 60 * 60);

    return sendResponse(res, 200, tableData, "Attendance fetched successfully");
  } catch (error) {
    await browser.close();
    console.error("❗ Attendance scraping failed:", error.message);
    return sendResponse(
      res,
      500,
      null,
      "Failed to fetch attendance data",
      error.message
    );
  }
});

// add notification future
// add multiple function of attendance
