import multer from 'multer';
import express from 'express';
import {
  list, create, update, view, dlt, dltPhoto, requestList, verifyRequest, declineRequest
} from '../../controllers/main/experience.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/experience' });

router.get('/list', list);
router.post('/create', [upload.any()], create);
router.put('/update/:modelId', [upload.any()], update);
router.get('/view/:modelId', view);
router.delete('/delete/:modelId', dlt);
router.delete('/deletePhoto/:modelId', dltPhoto);

router.get('/request/list', requestList);
router.post('/request/verify/:modelId', verifyRequest);
router.post('/request/decline/:modelId', declineRequest);

export default router;