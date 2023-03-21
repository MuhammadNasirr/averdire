import express from 'express';
import multer from 'multer';
import { endorse, endorseStats } from '../../controllers/common/experience.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/experience' });

router.post('/endorse', [upload.any()], endorse);
router.get('/endorse/stats/:modelId', endorseStats);

export default router;