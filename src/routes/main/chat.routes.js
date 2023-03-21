import express from 'express';
import multer from 'multer';
import {
  list, chatMessages, userRoom
} from '../../controllers/main/chat.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/chat' });

router.get('/list', list);
router.post('/messages/:modelId', [upload.any()], chatMessages);
router.get('/userRoom/:modelId', userRoom);

export default router;