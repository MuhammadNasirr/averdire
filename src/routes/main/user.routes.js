import multer from 'multer';
import express from 'express';
import {
  profile, update, updateAvatar, updateCoverPhoto, addSkill, dltSkill,
  addInterest, dltInterest
} from '../../controllers/main/user.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/user/avatar' });
var coverUpload = multer({ dest: 'uploads/user/coverPhoto' });

router.get('/profile', profile);
router.put('/update', [upload.any()], update);
router.post('/updateAvatar', [upload.fields([{ name: 'avatar', maxCount: 1 }])], updateAvatar);
router.post('/updateCoverPhoto', [coverUpload.fields([{ name: 'coverPhoto', maxCount: 1 }])], updateCoverPhoto);

// user skills routes
router.post('/addSkill', [upload.any()], addSkill);
router.delete('/deleteSkill/:modelId', dltSkill);

// user interests routes
router.post('/addInterest', [upload.any()], addInterest);
router.delete('/deleteInterest/:modelId', dltInterest);

export default router;
