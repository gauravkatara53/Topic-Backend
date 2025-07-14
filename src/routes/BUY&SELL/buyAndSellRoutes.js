import { Router } from "express";
import { verifyJWT } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/multer.js";
import {
  createListing,
  deleteListingImage,
  getAllListings,
  getAllListingsBuyer,
  getAllTransactions,
  getProductDetail,
  getProductDetailAsSeller,
  markListingAsSold,
  reserveListings,
  updateListing,
  uploadListingImage,
} from "../../controllers/BUY&SELL/listingController.js";

const router = Router();
router.post(
  "/create-listing",
  verifyJWT,
  upload.array("images", 5),
  createListing
);
router.route("/listing").get(getAllListings);
router.route("/my/listing").get(verifyJWT, getAllListings);
router.post("/reservation-listing/:id", verifyJWT, reserveListings);
router.post("/marking-sold/:id", verifyJWT, markListingAsSold);
router.get("/get-product/:id", getProductDetail);

// seller Route
router.get("/get-product/seller/:id", verifyJWT, getProductDetailAsSeller);
router.patch("/update/product/:id", verifyJWT, updateListing);
router.post(
  "/listing/image/update/:id",
  verifyJWT,
  upload.single("image"),
  uploadListingImage
);
router.post("/listing/image/delete/:id", verifyJWT, deleteListingImage);
router.get("/listing/my/order", verifyJWT, getAllListingsBuyer);

router.get("/all/my/txn", verifyJWT, getAllTransactions);

export default router;
