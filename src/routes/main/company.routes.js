import express from 'express';
import { listInstitutes, listCompanies } from "../../controllers/main/company.controller.js";

import {
  companyMemos
} from "../../controllers/main/memo.controller.js";

const router = express.Router();

router.get("/list", listCompanies);
router.get("/listInstitutes", listInstitutes);
router.get('/memo/:modelId', companyMemos);

export default router;