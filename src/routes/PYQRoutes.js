import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";

import {
  deletePyq,
  editPYQByAdmin,
  getPyq,
  pyqUpload,
} from "../controllers/pyqController.js";
import { checkRoleAndVerification } from "../middlewares/checkuploader.js";

const router = Router();

router.post(
  "/upload-pyq",
  verifyJWT,
  checkRoleAndVerification(["uploader", "admin", "student"]),
  upload.single("file"),
  pyqUpload
);
// router.post("/upload-notes", upload.single("file"), verifyJWT, notesUpload);
router.delete("/delete/:pyqId", verifyJWT, deletePyq);
router.get("/get/pyq", getPyq);

router.put(
  "/admin/edit-pyq/:pyqId",
  verifyJWT,
  checkRoleAndVerification(["admin"]),
  editPYQByAdmin
);

export default router;
