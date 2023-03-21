import express from 'express';
import multer from "multer";
import {
  view, update
} from "../../controllers/admin/content.controller.js";

const router = express.Router();
var upload = multer({ dest: 'uploads/content' });

router.get("/view", view);
router.post("/update", [upload.any()], update);

export default router;