import { Router } from "express";
import { globalSearchController } from "../controllers/searchController.js";

const router = Router();

router.route("/search").get(globalSearchController);
export default router;
