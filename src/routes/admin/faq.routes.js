import express from 'express';
import multer from "multer";
import {
    list, create, view, update, dlt
} from "../../controllers/admin/faq.controller.js";

const router = express.Router();
var upload = multer({ dest: 'uploads/content' });

router.get("/list", list);
router.get("/view/:modelId", view);
router.post("/create", [upload.any()], create);
router.post("/update/:modelId", [upload.any()], update);
router.delete("/delete/:modelId", dlt);

export default router;