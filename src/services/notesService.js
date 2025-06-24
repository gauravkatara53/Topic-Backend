import Notes from "../models/noteModel.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnSupabase } from "../utils/fileUpload.js";
import { getCache, setCache } from "../utils/nodeCache.js";
export const notesUploadService = async ({
  userId,
  notesLocalPath,
  title,
  description,
  semester,
  branch,
  subject,
}) => {
  if (!notesLocalPath) {
    throw new ApiError(400, "Notes file is missing");
  }

  const fileUrl = await uploadOnSupabase(notesLocalPath, "notes");
  if (!fileUrl) {
    throw new ApiError(400, "Error while uploading notes file");
  }

  const notes = await Notes.create({
    title,
    description,
    uploader: userId,
    semester,
    branch,
    subject,
    fileUrl,
  });

  return notes;
};

export const fetchNotes = async (query) => {
  const {
    page = 1,
    limit = 10,
    profession,
    title,
    semester,
    branch,
    subject,
    uploader,
  } = query;

  const filter = {};

  if (profession) filter.profession = profession;
  if (title) filter.title = { $regex: title, $options: "i" };
  if (semester) filter.semester = semester;
  if (branch) filter.branch = branch;
  if (subject) filter.subject = { $regex: subject, $options: "i" };
  if (uploader) filter.uploader = uploader;

  const cacheKey = `notes-${JSON.stringify(query)}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return { cached: true, data: cachedData };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [notes, total] = await Promise.all([
    Notes.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Notes.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  const result = {
    totalNotes: total,
    totalPages,
    currentPage: Number(page),
    notes,
  };

  setCache(cacheKey, result, 600); // Cache for 10 minutes

  return { cached: false, data: result };
};
