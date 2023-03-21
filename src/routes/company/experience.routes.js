import express from 'express';
import {
  requestsList, verifyRequest, declineRequest
} from '../../controllers/company/experience.controller.js';

const router = express.Router();

router.get('/requests', requestsList);
router.get('/verify/:modelId', verifyRequest);
router.get('/decline/:modelId', declineRequest);

export default router;