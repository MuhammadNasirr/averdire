import multer from 'multer';
import express from 'express';
import { 
    addBookmark, listBookmarks, dltBookmark, shareNews, listSharedNews, dltSharedNews,
    likeNews, unlikeNews, getPreferences, savePreferences, addComment, getComments
} from '../../controllers/main/rssNews.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/rssNews' });

// rss news bookmark routes
router.post('/bookmark/add', [upload.any()], addBookmark);
router.get('/bookmark/list', listBookmarks);
router.delete('/bookmark/delete/:modelId', dltBookmark);

// rss news distribution routes
router.post('/shared/share', [upload.any()], shareNews);
router.get('/shared/list', listSharedNews);
router.delete('/shared/delete/:modelId', dltSharedNews);
router.post('/shared/like', [upload.any()], likeNews);
router.post('/shared/unlike', [upload.any()], unlikeNews);
router.get('/shared/comment/:modelId', getComments);
router.post('/shared/comment/add', [upload.any()], addComment);

router.get('/preferences/get', getPreferences);
router.post('/preferences/save', [upload.any()], savePreferences);

export default router;