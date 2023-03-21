import multer from 'multer';
import express from 'express';
import {
  getMemoComments, addMemoComment
} from '../../controllers/main/memo.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/memo' });

router.get('/memoComment/:modelId', [upload.any()], getMemoComments);
router.post('/memoComment/add', [upload.any()], addMemoComment);

export default router;