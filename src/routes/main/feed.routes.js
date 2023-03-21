import multer from 'multer';
import express from 'express';
import {
  index, getPostComments, addPostComment, likePost, unlikePost
} from '../../controllers/main/feed.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/posts' });

router.get('/', index);
router.get('/postComment/:modelId', [upload.any()], getPostComments);
router.post('/postComment/add', [upload.any()], addPostComment);
router.post('/post/like', [upload.any()], likePost);
router.post('/post/unlike', [upload.any()], unlikePost);

export default router;