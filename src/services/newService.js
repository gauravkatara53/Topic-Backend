import NewModel from "../models/newsModel.js";
import ApiError from "../utils/ApiError.js";
import { deleteCache, getCache, setCache } from "../utils/nodeCache.js";

export const newsCreateService = async (req) => {
  const { title, content, link } = req.body;

  if (!title || !content || !link) {
    throw new ApiError(400, "All fields are required");
  }

  const news = await NewModel.create({
    title,
    content,
    link,
    date: new Date(), // Current date
    createdBy: req.user._id,
  });

  // Invalidate the cache after creation
  deleteCache("top_10_news");

  return news;
};

export const getTopNewsService = async () => {
  const cacheKey = "top_10_news";

  // Try to get from cache
  let news = getCache(cacheKey);

  if (news) {
    return news; // Serve from cache if available
  }

  // If not in cache, fetch from DB
  news = await NewModel.find().sort({ createdAt: -1 }).limit(10);

  // Save result in cache for future (TTL: 10 minutes for fresh news)
  setCache(cacheKey, news, 600); // TTL: 600 seconds = 10 minutes

  return news;
};

export const deleteNewsService = async (id) => {
  const news = await NewModel.findById(id);

  if (!news) {
    throw new ApiError(404, "News not found");
  }

  await NewModel.findByIdAndDelete(id);

  // Invalidate cache after deletion
  deleteCache("top_10_news");
};

export const updateNewsService = async (id, updatedData) => {
  const allowedFields = ["title", "content", "link"];
  const updatePayload = {};

  // Validate and filter allowed fields
  for (const field of allowedFields) {
    if (field in updatedData) {
      updatePayload[field] = updatedData[field];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(
      400,
      "At least one valid field (title, content, link) must be provided"
    );
  }

  const updatedNews = await NewModel.findByIdAndUpdate(id, updatePayload, {
    new: true,
  });

  if (!updatedNews) {
    throw new ApiError(404, "News not found");
  }

  // Invalidate cache after update
  deleteCache("top_10_news");

  return updatedNews;
};
