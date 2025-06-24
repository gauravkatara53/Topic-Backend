import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getCache, setCache } from "../utils/nodeCache.js";
import PYQ from "../models/PYQModel.js";
import NewModel from "../models/newsModel.js";
import Notes from "../models/noteModel.js";

export const globalSearchController = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Search query is required"));
  }

  const cacheKey = `global_search_${q.toLowerCase()}`;
  let cachedResults = getCache(cacheKey);

  if (cachedResults) {
    return res
      .status(200)
      .json(new ApiResponse(200, cachedResults, "Search results from cache"));
  }

  const regex = new RegExp(q, "i"); // Case-insensitive regex

  // Search in Notes
  const notesResults = await Notes.find({
    $or: [
      { title: { $regex: regex } },
      { description: { $regex: regex } },
      { subject: { $regex: regex } },
    ],
  }).limit(5);

  // Search in PYQs
  const pyqResults = await PYQ.find({
    $or: [
      { subject: { $regex: regex } },
      { description: { $regex: regex } },
      { year: { $regex: regex } },
    ],
  }).limit(5);

  // Search in News
  const newsResults = await NewModel.find({
    $or: [{ title: { $regex: regex } }, { content: { $regex: regex } }],
  }).limit(3);

  const searchResults = {
    notes: notesResults,
    pyqs: pyqResults,
    news: newsResults,
  };

  // Cache the results for 10 minutes
  setCache(cacheKey, searchResults, 600);

  return res
    .status(200)
    .json(
      new ApiResponse(200, searchResults, "Search results fetched successfully")
    );
});
