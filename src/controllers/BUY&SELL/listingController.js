import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  createListingService,
  deleteListingImageService,
  getAllListingBuyerService,
  getAllListingService,
  getAllTransactionsService,
  markAsSold,
  reserveListingService,
  updateListingService,
  uploadListingImageService,
} from "../../services/BUY&SELL/listingService.js";
import Listing from "../../models/BUY&SELL/ListingModel.js";
import ApiError from "../../utils/ApiError.js";
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
// update listing detail
export const updateListing = asyncHandler(async (req, res) => {
  const listingId = req.params.id;
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
    status,
  } = req.body;

  const updatedListing = await updateListingService(listingId, sellerId, {
    title,
    description,
    price,
    condition,
    category,
    location,
    upiId,
    allowCash,
    whatsappNumber,
    status,
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedListing, "Listing updated successfully"));
});

// Upload image
export const uploadListingImage = asyncHandler(async (req, res) => {
  const imageFile = req.file;
  const listingId = req.params.id;

  if (!imageFile) {
    throw new ApiError(400, "No image file provided");
  }

  const imageUrl = await uploadListingImageService(imageFile, listingId);

  res
    .status(200)
    .json(new ApiResponse(200, { imageUrl }, "Image uploaded successfully"));
});

// Delete image
export const deleteListingImage = asyncHandler(async (req, res) => {
  const listingId = req.params.id;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    throw new ApiError(400, "Image URL is required to delete");
  }

  await deleteListingImageService(imageUrl, listingId);

  res.status(200).json(new ApiResponse(200, {}, "Image deleted successfully"));
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

// get product detail ---

export const getProductDetail = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  // const userId = req.user._id; // Assuming req.user is set by auth middleware

  const product = await Listing.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // const isAvailable = product.status === "available";
  // const isBuyer = product.buyerId?.toString() === userId.toString();
  // const isReserver = product.reservedBy?.toString() === userId.toString();

  // if (!isAvailable && !isBuyer && !isReserver) {
  //   throw new ApiError(403, "You are not authorized to view this product");
  // }

  res.status(200).json(new ApiResponse(200, product, "Item fetched"));
});

// get product detail as Seller
export const getProductDetailAsSeller = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id; // Assuming req.user is set by auth middleware

  const product = await Listing.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  const isSeller = product.sellerId?.toString() === userId.toString();

  if (!isSeller) {
    throw new ApiError(403, "You are not authorized to view this product");
  }

  res.status(200).json(new ApiResponse(200, product, "Item fetched"));
});

// all order of user
export const getAllListingsBuyer = asyncHandler(async (req, res) => {
  const { search, location, minPrice, maxPrice, sort, status, page, limit } =
    req.query;

  const userId = req.user?._id;

  const result = await getAllListingBuyerService({
    userId,
    search,
    location,
    minPrice,
    maxPrice,
    sort,
    status,
    page,
    limit,
  });

  res.status(200).json(
    new ApiResponse(200, result.listings, "Listings fetched successfully", {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalCount,
    })
  );
});

export const getAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user?._id;

  const result = await getAllTransactionsService({
    userId,
    page: Number(page),
    limit: Number(limit),
  });

  res.status(200).json(
    new ApiResponse(
      200,
      result.transactions,
      "Transactions fetched successfully",
      {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
      }
    )
  );
});
