import express from 'express';
import { publicProfile } from '../../controllers/public/company.controller.js';

const router = express.Router();

router.get('/publicProfile/:modelId', publicProfile);

export default router;