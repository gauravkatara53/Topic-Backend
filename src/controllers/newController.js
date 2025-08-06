import NewModel from "../models/newsModel.js";
import {
  deleteNewsService,
  getTopNewsService,
  newsCreateService,
  updateNewsService,
} from "../services/newService.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createNewController = asyncHandler(async (req, res) => {
  const news = await newsCreateService(req);

  return res
    .status(201)
    .json(new ApiResponse(201, news, "News created successfully"));
});

export const getTopNewsController = asyncHandler(async (req, res) => {
  const news = await getTopNewsService();

  return res
    .status(200)
    .json(
      new ApiResponse(200, news, "Top 10 recent news fetched successfully")
    );
});

export const deleteNewsController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await deleteNewsService(id);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "News deleted successfully"));
});

export const updateNewsController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const updatedNews = await updateNewsService(id, updatedData);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNews, "News updated successfully"));
});
