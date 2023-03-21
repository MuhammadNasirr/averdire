import express from 'express';
import {
  listAll, view, deleteJob
} from '../../controllers/admin/job.controller.js';

const router = express.Router();

router.post('/listAll', listAll);
router.get('/view/:modelId', view);
router.delete('/delete/:modelId', deleteJob);

export default router;