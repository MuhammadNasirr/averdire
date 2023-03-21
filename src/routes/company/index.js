import express from 'express';
import companyRoutes from './company.routes.js';
import jobRoutes from './job.routes.js';
import userRoutes from './user.routes.js';
import experienceRoutes from './experience.routes.js';
import educationRoutes from './education.routes.js';
import memoRoutes from './memo.routes.js';

const router = express.Router();

router.use('/company', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/user', userRoutes);
router.use('/experience', experienceRoutes);
router.use('/education', educationRoutes);
router.use('/memo', memoRoutes);

export default router;