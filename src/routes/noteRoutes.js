import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";

import {
  deleteNote,
  editNoteByAdmin,
  getNotes,
  notesUpload,
} from "../controllers/notesController.js";
import { checkRoleAndVerification } from "../middlewares/checkuploader.js";
// import { checkRoleAndVerification } from "../middlewares/checkuploader.js";

const router = Router();

router.post(
  "/upload-notes",
  verifyJWT,
  // checkRoleAndVerification(["uploader", "admin"]),
  upload.single("file"),
  notesUpload
);
// router.post("/upload-notes", upload.single("file"), verifyJWT, notesUpload);
router.delete("/delete/:noteId", verifyJWT, deleteNote);
router.get("/get/notes", getNotes);

router.put(
  "/admin/edit-note/:noteId",
  verifyJWT,
  checkRoleAndVerification(["admin"]),
  editNoteByAdmin
);

export default router;
