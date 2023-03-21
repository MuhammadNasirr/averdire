import express from 'express';
import userRoutes from './user.routes.js';
import postRoutes from './post.routes.js';
import jobRoutes from './job.routes.js';
import companyRoutes from './company.routes.js';
import dataRoutes from './data.routes.js';
import abuseReportRoutes from './abuseReport.routes.js';
import contentRoutes from './content.routes.js';
import reportsRoutes from './reports.routes.js';
import faqRoutes from './faq.routes.js';

const router = express.Router();

router.use('/user', userRoutes);
router.use('/post', postRoutes);
router.use('/jobs', jobRoutes);
router.use('/company', companyRoutes);
router.use('/data', dataRoutes);
router.use('/abuseReport', abuseReportRoutes);
router.use('/content', contentRoutes);
router.use('/reports', reportsRoutes);
router.use('/faq', faqRoutes);

export default router;