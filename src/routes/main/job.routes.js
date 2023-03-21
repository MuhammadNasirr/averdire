import multer from 'multer';
import express from 'express';
import {
  search, apply, myApplications, detail, invitationList, declineInvitation
} from '../../controllers/main/job.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/job' });

router.post('/search', [upload.any()], search);
router.get('/detail/:modelId', detail);
router.post('/apply/:modelId', [upload.any()], apply);
router.get('/applications/myList', myApplications);
router.get('/invitation/list', invitationList)
router.get('/invitation/decline/:modelId', declineInvitation)

export default router;