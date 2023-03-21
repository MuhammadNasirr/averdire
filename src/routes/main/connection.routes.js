import multer from 'multer';
import express from 'express';
import {
  createConnectionRequest, listConnectionRequest, updateConnectionRequest, listConnection
} from '../../controllers/main/connection.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/connection' });

router.get('/request/create/:receiverId', createConnectionRequest);
router.get('/request/list', listConnectionRequest);
router.put('/request/update/:id', [upload.any()], updateConnectionRequest);

router.get('/list', listConnection);

export default router;