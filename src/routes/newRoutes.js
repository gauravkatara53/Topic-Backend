import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { checkRoleAndVerification } from "../middlewares/checkuploader.js";
import {
  createNewController,
  getTopNewsController,
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

export default router;
