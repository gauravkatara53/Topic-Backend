import { flushCache } from "../utils/nodeCache.js";
import { supabase } from "../utils/supabaseClient.js";
import { ApiResponse, sendResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { fetchPyq, pyqUploadService } from "../services/PYQService.js";
import PYQ from "../models/PYQModel.js";

// upload notes
export const pyqUpload = asyncHandler(async (req, res) => {
  const pyqLocalPath = req.file?.path;
  const userId = req.user?._id;

  // Destructure necessary fields from the request body
  const { title, semester, branch, subject, term, sessionFrom, sessionTo } =
    req.body;

  const pyq = await pyqUploadService({
    userId,
    pyqLocalPath,
    title,
    semester,
    branch,
    subject,
    term,
    sessionFrom,
    sessionTo,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, pyq, "Pyq uploaded successfully"));
});

// fix issue the delete file from the superbase also
export const deletePyq = asyncHandler(async (req, res) => {
  const pyqId = req.params.pyqId;
  const userId = req.user._id;

  console.log("Request to delete pyq:", pyqId, "by user:", userId);

  const pyq = await PYQ.findById(pyqId);

  if (!pyq) {
    console.log("pyq not found for ID:", pyqId);
    throw new ApiError(404, "Note not found");
  }

  if (pyq.uploader.toString() !== userId.toString()) {
    console.log("Unauthorized delete attempt by user:", userId);
    throw new ApiError(
      403,
      "Forbidden: You are not allowed to delete this pyq"
    );
  }

  console.log("pyq found:", pyq);

  // ✅ Correctly extract the file path
  const urlParts = pyq.fileUrl.split("/topic/");
  const filePath = urlParts[1]; // Should be: notes/filename.pdf

  console.log("Extracted filePath:", filePath);

  // ✅ Delete file from Supabase
  const { error } = await supabase.storage.from("topic").remove([filePath]);

  if (error) {
    console.log("Error deleting from Supabase:", error);
    throw new ApiError(500, "Error deleting file from Supabase storage", error);
  }

  console.log("File deleted from Supabase successfully.");

  // ✅ Delete note from DB
  await pyq.deleteOne();

  console.log("pyq deleted from database.");

  // ✅ Clear cache
  flushCache();

  console.log("Cache flushed successfully.");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "pyq and file deleted successfully"));
});

export const getPyq = asyncHandler(async (req, res) => {
  const { cached, data } = await fetchPyq(req.query);

  if (cached) {
    return sendResponse(res, 200, data, "pyq fetched from cache");
  }

  return sendResponse(res, 200, data, "pyq fetched successfully");
});
