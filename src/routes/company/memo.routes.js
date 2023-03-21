import multer from 'multer';
import express from 'express';
import {
  list, create, update, view, dlt, getMemoComments, addMemoComment
} from '../../controllers/company/memo.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/memo' });

router.get('/list', list);
router.post('/create', [
  upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'document', maxCount: 1 }
  ])
], create);
router.put('/update/:modelId', [
  upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'document', maxCount: 1 }
  ])
], update);
router.get('/view/:modelId', view);
router.delete('/delete/:modelId', dlt);

//Route defined for memo comments
router.get('/memoComment/:modelId', [upload.any()], getMemoComments);
router.post('/memoComment/add', [upload.any()], addMemoComment);

export default router;