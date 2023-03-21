import express from 'express';
import multer from 'multer';

import {
  publicProfile, followUser, unFollowUser, userFollowStats, checkReport, reportUser, ratingStats
} from '../../controllers/common/user.controller.js';
import { signout } from '../../controllers/main/auth.controller.js';


const router = express.Router();
var upload = multer({ dest: 'uploads/user/avatar' });

router.post('/signout', [upload.any()], signout);

router.get('/publicProfile/:modelId', publicProfile);

router.delete('/follow/remove/:modelId', unFollowUser);
router.get('/follow/stats/:modelId', userFollowStats);
router.get('/follow/:modelId', followUser);

router.get('/rating/stats/:modelId', ratingStats);

router.post('/report/:modelId', [upload.any()], reportUser);
router.get('/report/check/:modelId', checkReport);

export default router;