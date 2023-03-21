import multer from 'multer';
import express from 'express';
import {
  listEmployees, listStudents, listStudentBatches, jobInvitationUserSearch, getCeo, addCeo
} from '../../controllers/company/user.controller.js';

const router = express.Router();
var upload = multer({ dest: 'uploads/user' });

router.get('/jobInvitationUserSearch/:modelId', jobInvitationUserSearch);
router.get('/employees', listEmployees);
router.get('/students', listStudents);
router.get('/studentBatches', listStudentBatches);
router.get('/getCeo', getCeo);
router.post('/addCeo', [upload.any()], addCeo);

export default router;
