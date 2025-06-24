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
