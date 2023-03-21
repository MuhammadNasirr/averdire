import express from 'express';
import {
  listAll, postComments
} from '../../controllers/admin/post.controller.js';

const router = express.Router();

router.post('/listAll', listAll);
router.get('/postComments/:modelId', postComments);

export default router;
