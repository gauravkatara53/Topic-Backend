import { Router } from "express";
import { verifyJWT } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/multer.js";
import {
  createListing,
  getAllListings,
  markListingAsSold,
  reserveListings,
} from "../../controllers/BUY&SELL/listingController.js";

const router = Router();
router.post(
  "/create-listing",
  verifyJWT,
  upload.array("images", 5),
  createListing
);
router.route("/listing").get(getAllListings);
router.post("/reservation-listing/:id", verifyJWT, reserveListings);
router.post("/marking-sold/:id", verifyJWT, markListingAsSold);
export default router;
