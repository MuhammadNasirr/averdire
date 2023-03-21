import express from 'express';
import {
  listAll, view, activate, deactivate
} from "../../controllers/admin/company.controller.js";

const router = express.Router();

router.post("/listAll", listAll);
router.get("/view/:modelId", view);
router.get('/activate/:modelId', activate);
router.get('/deactivate/:modelId', deactivate);

export default router;