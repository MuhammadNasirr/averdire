import express from 'express';
import {
  listAllAbuseReports
} from '../../controllers/admin/user.controller.js';

const router = express.Router();

router.post('/listAll', listAllAbuseReports);

export default router;
