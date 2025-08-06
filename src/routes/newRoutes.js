import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { checkRoleAndVerification } from "../middlewares/checkuploader.js";
import {
  createNewController,
  deleteNewsController,
  getTopNewsController,
  updateNewsController,
} from "../controllers/newController.js";
import { globalSearchController } from "../controllers/searchController.js";

const router = Router();

router.post(
  "/create/news",
  verifyJWT,
  checkRoleAndVerification(["admin"]),
  createNewController
);
router.get("/get/current/new", getTopNewsController);

router.patch(
  "/update/:id",
  verifyJWT,
  checkRoleAndVerification(["admin"]),
  updateNewsController
);

router.delete(
  "/delete/:id",
  verifyJWT,
  checkRoleAndVerification(["admin"]),
  deleteNewsController
);

export default router;
