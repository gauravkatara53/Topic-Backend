import NewModel from "../models/newsModel.js";
import {
  getTopNewsService,
  newsCreateService,
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
