import multer from 'multer';
import express from 'express';
import {
  list, create, update, view, dlt, applications, viewApplication, jobInvitationsList, sendInvite
} from '../../controllers/company/job.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/job' });

router.get('/list', list);
router.post('/create', [upload.any()], create);
router.put('/update/:modelId', [upload.any()], update);
router.get('/view/:modelId', view);
router.delete('/delete/:modelId', dlt);
router.get('/applications/list/:modelId', applications);
router.get('/applications/view/:modelId', viewApplication);
router.get('/invitation/list/:modelId', jobInvitationsList);
router.post('/invitation/send/:modelId', [upload.any()], sendInvite);

export default router;