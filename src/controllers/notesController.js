import Notes from "../models/noteModel.js";
import { flushCache } from "../utils/nodeCache.js";
import { fetchNotes, notesUploadService } from "../services/notesService.js";
import { supabase } from "../utils/supabaseClient.js";
import { ApiResponse, sendResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// upload notes
export const notesUpload = asyncHandler(async (req, res) => {
  const notesLocalPath = req.file?.path;
  const userId = req.user?._id;

  // Destructure necessary fields from the request body
  const { title, description, semester, branch, subject } = req.body;

  const notes = await notesUploadService({
    userId,
    notesLocalPath,
    title,
    description,
    semester,
    branch,
    subject,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Note uploaded successfully"));
});

// fix issue the delete file from
export const deleteNote = asyncHandler(async (req, res) => {
  const noteId = req.params.noteId;
  const userId = req.user._id;

  console.log("Request to delete note:", noteId, "by user:", userId);

  const note = await Notes.findById(noteId);

  if (!note) {
    console.log("Note not found for ID:", noteId);
    throw new ApiError(404, "Note not found");
  }

  if (note.uploader.toString() !== userId.toString()) {
    console.log("Unauthorized delete attempt by user:", userId);
    throw new ApiError(
      403,
      "Forbidden: You are not allowed to delete this note"
    );
  }

  console.log("Note found:", note);

  // ✅ Correctly extract the file path
  const urlParts = note.fileUrl.split("/topic/");
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
  await note.deleteOne();

  console.log("Note deleted from database.");

  // ✅ Clear cache
  flushCache();

  console.log("Cache flushed successfully.");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Note and file deleted successfully"));
});

export const getNotes = asyncHandler(async (req, res) => {
  const { cached, data } = await fetchNotes(req.query);

  if (cached) {
    return sendResponse(res, 200, data, "Notes fetched from cache");
  }

  return sendResponse(res, 200, data, "Notes fetched successfully");
});
