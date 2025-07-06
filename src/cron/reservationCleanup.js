// cron/expireReservations.js
import cron from "node-cron";
import ListingReservation from "../models/BUY&SELL/ListingReservationModel.js";
import Listing from "../models/BUY&SELL/ListingModel.js";
import { deleteCache } from "../utils/nodeCache.js";

const expireReservations = async () => {
  const now = new Date();

  const expiredReservations = await ListingReservation.find({
    expiresAt: { $lt: now },
    isExpired: false,
  });

  for (const reservation of expiredReservations) {
    const listing = await Listing.findById(reservation.listingId);

    if (!listing || listing.status === "sold") continue; // skip sold listings

    // Expire reservation
    reservation.isExpired = true;
    await reservation.save();

    // Update listing back to available
    listing.status = "available";
    listing.reservedBy = null;
    listing.reservedAt = null;
    listing.reservationExpiresAt = null;
    await listing.save();

    console.log(`[CRON] Reservation expired for listing ${listing._id}`);
  }

  if (expiredReservations.length > 0) deleteCache("all_listings");
};

// Every 1 hour
cron.schedule("0 * * * *", expireReservations);
