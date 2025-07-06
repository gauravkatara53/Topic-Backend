import Listing from "../../models/BUY&SELL/ListingModel.js";
// import ListingReservation from "../models/ListingReservation.js";
// import ListingTransaction from "../models/ListingTransaction.js";
import ApiError from "../../utils/ApiError.js";
import { setCache, getCache, deleteCache } from "../../utils/nodeCache.js";
import { uploadOnSupabase } from "../../utils/fileUpload.js";
import User from "../../models/userModel.js";
import ListingReservationModel from "../../models/BUY&SELL/ListingReservationModel.js";
import ListingTransactionModel from "../../models/BUY&SELL/ListingTransactionModel.js";

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

  deleteCache("all_listings");

  return listing;
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

  deleteCache("all_listings");

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

  if (!listing) throw new ApiError(404, "Listing not found or unauthorized");
  if (listing.status === "sold")
    throw new ApiError(400, "Listing already sold");

  // Update listing
  listing.status = "sold";
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
  return transaction;
};
