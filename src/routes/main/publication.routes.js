import multer from 'multer';
import express from 'express';
import {
  list, create, update, view, dlt, addBookmark, listBookmarks, dltBookmark, feed, 
  getPublicationComments, addPublicationComment, likePublication, unlikePublication
} from '../../controllers/main/publication.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/publications' });

// publication routes
router.get('/list', list);
router.post('/create', [upload.fields([{ name: 'banner', maxCount: 1 }])], create);
router.put('/update/:modelId', [upload.fields([{ name: 'banner', maxCount: 1 }])], update);
router.get('/view/:modelId', view);
router.delete('/delete/:modelId', dlt);

// publication bookmark routes
router.post('/bookmark/add', [upload.any()], addBookmark);
router.get('/bookmark/list', listBookmarks);
router.delete('/bookmark/delete/:modelId', dltBookmark);

// publication distribution routes
router.get('/feed', feed);

//Route defined for Publication Comments
router.get('/publicationComment/:modelId', [upload.any()], getPublicationComments);
router.post('/publicationComment/add', [upload.any()], addPublicationComment);
router.post('/like', [upload.any()], likePublication);
router.post('/unlike', [upload.any()], unlikePublication);

export default router;