import multer from 'multer';
import express from 'express';
import {
  list, create, update, view, dlt, dltPhoto
} from '../../controllers/main/education.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/education' });

router.get('/list', list);
router.post('/create', [upload.any()], create);
router.put('/update/:modelId', [upload.any()], update);
router.get('/view/:modelId', view);
router.delete('/delete/:modelId', dlt);
router.delete('/deletePhoto/:modelId', dltPhoto);

export default router;