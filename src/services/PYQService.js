import PYQ from "../models/PYQModel.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnSupabase } from "../utils/fileUpload.js";
import { getCache, setCache } from "../utils/nodeCache.js";

export const pyqUploadService = async ({
  userId,
  pyqLocalPath,
  title,
  semester,
  term,
  branch,
  subject,
  sessionFrom,
  sessionTo,
}) => {
  if (!pyqLocalPath) {
    throw new ApiError(400, "PYQ file is missing");
  }

  const fileUrl = await uploadOnSupabase(pyqLocalPath, "PYQ");
  if (!fileUrl) {
    throw new ApiError(400, "Error while uploading pyq file");
  }

  const pyq = await PYQ.create({
    title,
    uploader: userId,
    semester,
    term,
    branch,
    subject,
    fileUrl,
    sessionFrom,
    sessionTo,
  });

  return pyq;
};

export const fetchPyq = async (query) => {
  const {
    page = 1,
    limit = 10,
    profession,
    title,
    semester,
    branch,
    subject,
    term,
    uploader,
    sessionFrom,
    sessionTo,
  } = query;

  const filter = {};

  if (profession) filter.profession = profession;
  if (title) filter.title = { $regex: title, $options: "i" };
  if (semester) filter.semester = semester;
  if (term) filter.term = term;
  if (branch) filter.branch = branch;
  if (subject) filter.subject = { $regex: subject, $options: "i" };
  if (uploader) filter.uploader = uploader;

  if (sessionFrom) filter.sessionFrom = Number(sessionFrom);
  if (sessionTo) filter.sessionTo = Number(sessionTo);

  const cacheKey = `pyq-${JSON.stringify(query)}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return { cached: true, data: cachedData };
  }

  const currentPage = Math.max(Number(page), 1);
  const pageLimit = Math.max(Number(limit), 1);
  const skip = (currentPage - 1) * pageLimit;

  const [pyqs, total] = await Promise.all([
    PYQ.find(filter).skip(skip).limit(pageLimit).sort({ createdAt: -1 }),
    PYQ.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / pageLimit);

  const result = {
    totalPyqs: total,
    totalPages,
    currentPage,
    pyqs,
  };

  setCache(cacheKey, result, 600); // Cache for 10 minutes

  return { cached: false, data: result };
};
