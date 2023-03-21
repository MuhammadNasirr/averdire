import multer from 'multer';
import express from 'express';
import { signin } from '../../controllers/admin/auth.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/user' });

router.post('/signin', [upload.any()], signin);

export default router;