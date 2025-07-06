import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  createListingService,
  getAllListingService,
  markAsSold,
  reserveListingService,
} from "../../services/BUY&SELL/listingService.js";

// Create a new listing
export const createListing = asyncHandler(async (req, res) => {
  const imageFiles = req.files; // array of images
  const sellerId = req.user?._id;

  const {
    title,
    description,
    price,
    condition,
    category,
    location,
    upiId,
    allowCash,
    whatsappNumber,
  } = req.body;

  const listing = await createListingService({
    imageFiles,
    sellerId,
    title,
    description,
    price,
    condition,
    category,
    location,
    upiId,
    allowCash,
    whatsappNumber,
  });

  res
    .status(201)
    .json(new ApiResponse(201, listing, "Listing created successfully"));
});

// Get all active listings
export const getAllListings = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    condition,
    location,
    minPrice,
    maxPrice,
    sort,
    sellerId,
    status,
  } = req.query;

  const listings = await getAllListingService({
    search,
    category,
    condition,
    location,
    minPrice,
    maxPrice,
    sort,
    sellerId,
    status,
  });

  res.status(200).json(new ApiResponse(200, listings));
});

// Reserve a listing
export const reserveListings = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;
  const listingId = req.params.id;

  const reserved = await reserveListingService(listingId, buyerId);
  res
    .status(200)
    .json(new ApiResponse(200, reserved, "Listing reserved successfully"));
});

// Mark item as sold
export const markListingAsSold = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const listingId = req.params.id;
  const { finalSellingPrice, paymentMethod, transactionId } = req.body;

  const transaction = await markAsSold({
    sellerId,
    listingId,
    finalSellingPrice,
    paymentMethod,
    transactionId,
  });

  res
    .status(200)
    .json(new ApiResponse(200, transaction, "Item marked as sold"));
});
