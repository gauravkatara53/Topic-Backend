import Listing from "../../models/BUY&SELL/ListingModel.js";
// import ListingReservation from "../models/ListingReservation.js";
// import ListingTransaction from "../models/ListingTransaction.js";
import ApiError from "../../utils/ApiError.js";
import {
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPrefix,
} from "../../utils/nodeCache.js";
import { uploadOnSupabase } from "../../utils/fileUpload.js";
import User from "../../models/userModel.js";
import ListingReservationModel from "../../models/BUY&SELL/ListingReservationModel.js";
import ListingTransactionModel from "../../models/BUY&SELL/ListingTransactionModel.js";
import { deleteFromSupabase } from "../../utils/deleteFromSupabase.js";

// CREATE LISTING
export const createListingService = async ({
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
}) => {
  if (!imageFiles || imageFiles.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }

  const seller = await User.findById(sellerId).select(
    "-password -refreshToken"
  );
  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  const uploadedImages = [];

  for (const file of imageFiles) {
    const url = await uploadOnSupabase(file.path, "image");
    if (!url) {
      throw new ApiError(400, `Error uploading ${file.originalname}`);
    }
    uploadedImages.push(url);
  }

  const listing = await Listing.create({
    images: uploadedImages,
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
    contactNumber: seller.number,
    contactEmail: seller.email,
    contactName: seller.name,
  });

  deleteCacheByPrefix("all_listings:");

  return listing;
};

// update the product details
export const updateListingService = async (listingId, sellerId, updates) => {
  const allowedFields = [
    "title",
    "description",
    "price",
    "condition",
    "category",
    "location",
    "upiId",
    "allowCash",
    "whatsappNumber",
    "status",
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }

  const listing = await Listing.findOne({ _id: listingId, sellerId });

  if (!listing) {
    throw new ApiError(404, "Listing not found or unauthorized");
  }

  Object.assign(listing, updateData);
  await listing.save();

  deleteCacheByPrefix("all_listings:");

  return listing;
};
// update the image
export const uploadListingImageService = async (file, listingId) => {
  const imageUrl = await uploadOnSupabase(file.path, "image");
  if (!imageUrl) throw new ApiError(500, "Image upload failed");

  if (listingId) {
    const listing = await Listing.findById(listingId);
    if (!listing) throw new ApiError(404, "Listing not found");

    // Append the image URL to the existing array
    listing.images.push(imageUrl);
    await listing.save();

    // Clear related caches
    deleteCacheByPrefix(`listing:${listingId}`);
    deleteCacheByPrefix("all_listings:");
  }

  return imageUrl;
};
// delete the image
export const deleteListingImageService = async (imageUrl, listingId) => {
  const success = await deleteFromSupabase(imageUrl);
  if (!success) throw new ApiError(500, "Image deletion failed");

  if (listingId) {
    const listing = await Listing.findById(listingId);
    if (!listing) throw new ApiError(404, "Listing not found");

    const originalCount = listing.images.length;
    listing.images = listing.images.filter((url) => url !== imageUrl);

    if (listing.images.length === originalCount) {
      throw new ApiError(400, "Image not found in listing images array");
    }

    await listing.save();

    deleteCacheByPrefix(`listing:${listingId}`);
    deleteCacheByPrefix("all_listings:");
  }

  return true;
};

// GET ALL LISTINGS (with cache)
export const getAllListingService = async ({
  search,
  category,
  condition,
  location,
  minPrice,
  maxPrice,
  sort,
  sellerId,
  status,
}) => {
  const filter = {};

  // Search in title or description
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (location) filter.location = { $regex: location, $options: "i" };
  if (status) filter.status = status;
  if (sellerId) filter.sellerId = sellerId;

  // Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Sort logic
  let sortOption = { createdAt: -1 }; // default sort: latest
  if (sort === "price_asc") sortOption = { price: 1 };
  if (sort === "price_desc") sortOption = { price: -1 };
  if (sort === "latest") sortOption = { createdAt: -1 };

  // Safe cache key
  const cacheKey = `all_listings:${JSON.stringify(
    filter
  )}:sort=${JSON.stringify(sortOption)}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const listings = await Listing.find(filter).sort(sortOption);
  setCache(cacheKey, listings, 300); // 5 minutes

  return listings;
};

// RESERVE LISTING
export const reserveListingService = async (listingId, buyerId) => {
  const now = new Date();

  const listing = await Listing.findOne({
    _id: listingId,
    status: { $in: ["available", "reserved"] },
    $or: [{ reservedBy: null }, { reservationExpiresAt: { $lt: now } }],
  });

  if (!listing) {
    throw new ApiError(409, "Item is already reserved or sold.");
  }
  if (listing.sellerId.toString() === buyerId.toString()) {
    throw new ApiError(409, "Seller cannot reserve their own item.");
  }

  const reservedAt = now;
  const expiresAt = new Date(reservedAt.getTime() + 24 * 60 * 60 * 1000); // 24h

  // Update listing
  listing.status = "reserved";
  listing.reservedBy = buyerId;
  listing.reservedAt = reservedAt;
  listing.reservationExpiresAt = expiresAt;
  await listing.save();

  // Create reservation entry
  await ListingReservationModel.create({
    listingId,
    buyerId,
    reservedAt,
    expiresAt,
  });

  deleteCacheByPrefix("all_listings:");
  deleteCacheByPrefix(`buyer_listings:${listing.reservedBy}`);

  return listing;
};

// MARK ITEM AS SOLD
export const markAsSold = async ({
  sellerId,
  listingId,
  finalSellingPrice,
  paymentMethod,
  transactionId,
}) => {
  const listing = await Listing.findOne({ _id: listingId, sellerId });

  if (!listing) throw new ApiError(404, "Listing not found ");
  if (listing.status === "sold")
    throw new ApiError(400, "Listing already sold");
  if (!listing.reservedBy) {
    throw new ApiError(500, "No Reservation not found");
  }
  // Update listing
  listing.status = "sold";
  listing.finalPrice = finalSellingPrice;

  listing.soldAt = new Date();
  await listing.save();

  const transaction = await ListingTransactionModel.create({
    listingId,
    sellerId,
    buyerId: listing.reservedBy,
    finalSellingPrice,
    paymentMethod,
    transactionId: paymentMethod === "upi" ? transactionId : null,
    soldAt: new Date(),
  });

  deleteCache("all_listings");
  deleteCacheByPrefix(`buyer_listings:${listing.reservedBy}`);
  deleteCacheByPrefix(`transactions:${listing.reservedBy}`);
  deleteCacheByPrefix(`transactions:${listing.sellerId}`);
  return transaction;
};

// all listing for buyer
export const getAllListingBuyerService = async ({
  userId,
  search,
  location,
  minPrice,
  maxPrice,
  sort,
  status,
  page = 1,
  limit = 10,
}) => {
  const filter = {
    $or: [{ buyerId: userId }, { reservedBy: userId }],
  };

  // Search
  if (search) {
    filter.$and = [
      {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      },
    ];
  }

  if (location) filter.location = { $regex: location, $options: "i" };
  if (status) filter.status = status;

  // Price filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Sort
  let sortOption = { createdAt: -1 };
  if (sort === "price_asc") sortOption = { price: 1 };
  if (sort === "price_desc") sortOption = { price: -1 };
  if (sort === "latest") sortOption = { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  // Cache key
  const cacheKey = `buyer_listings:${userId}:${JSON.stringify(
    filter
  )}:sort=${JSON.stringify(sortOption)}:page=${page}:limit=${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Count total for pagination
  const totalCount = await Listing.countDocuments(filter);

  const listings = await Listing.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const result = {
    listings,
    totalCount,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / limit),
  };

  setCache(cacheKey, result, 300);

  return result;
};

export const getAllTransactionsService = async ({
  userId,
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * limit;

  const filter = {
    $or: [{ buyerId: userId }, { sellerId: userId }],
  };

  const cacheKey = `transactions:${userId}:page=${page}:limit=${limit}`;

  const cached = getCache(cacheKey);
  if (cached) return cached;

  const totalCount = await ListingTransactionModel.countDocuments(filter);

  const transactions = await ListingTransactionModel.find(filter)
    .populate("listingId", "title images price status")
    .populate("buyerId", "name email")
    .populate("sellerId", "name email")
    .sort({ soldAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const enrichedTransactions = transactions.map((txn) => ({
    ...txn,
    credit: String(txn.sellerId._id) === String(userId),
    debit: String(txn.buyerId._id) === String(userId),
  }));

  const result = {
    transactions: enrichedTransactions,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };

  setCache(cacheKey, result, 300); // cache for 5 mins (300 sec)

  return result;
};
