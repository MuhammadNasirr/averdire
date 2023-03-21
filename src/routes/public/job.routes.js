import multer from 'multer';
import express from 'express';
import { list, view, globalJobSearch } from "../../controllers/public/job.controller.js";

const router = express.Router();
var upload = multer({ dest: 'uploads/job' });

router.post('/search', [upload.any()], globalJobSearch);
router.get("/list", list);
router.get("/view/:modelId", view);

export default router;