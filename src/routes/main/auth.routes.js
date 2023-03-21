import multer from 'multer';
import express from 'express';
import { verifySignUp } from '../../middlewares/index.js';
import { signup, signin, forgot, checkReset, reset, verifyAccount } from '../../controllers/main/auth.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/user' });

router.post(
  '/signup',
  [
    upload.any(),
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted,
  ],
  signup
);
router.post('/signin', [upload.any()], signin);
router.post('/forgot', [upload.any()], forgot);
router.get('/checkReset/:token', checkReset);
router.post('/reset', [upload.any()], reset);
router.post('/verifyAccount/:token', [upload.any()], verifyAccount);

export default router;