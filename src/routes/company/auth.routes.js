import multer from 'multer';
import express from 'express';
import { verifySignUp } from '../../middlewares/index.js';
import { signupCompany, signinCompany } from '../../controllers/main/auth.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/user' });

router.post(
  '/signup',
  [
    upload.any(),
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted,
  ],
  signupCompany
);
router.post('/signin', [upload.any()], signinCompany);

export default router;