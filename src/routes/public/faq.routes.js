import express from 'express';
import { list, view } from "../../controllers/public/faq.controller.js";

const router = express.Router();

router.get("/list", list);
router.get("/view/:modelId", view);

export default router;