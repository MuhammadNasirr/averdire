import express from 'express';
import faqRoutes from './faq.routes.js';
import userRoutes from './user.routes.js';
import companyRoutes from './company.routes.js';
import publicationRoutes from './publication.routes.js';
import jobRoutes from './job.routes.js';

import { globalSearch, emailTest, simpleEmailTest } from '../../controllers/public/public.controller.js';

const router = express.Router();

router.use('/faq', faqRoutes);
router.use('/user', userRoutes);
router.use('/company', companyRoutes);
router.use('/publication', publicationRoutes);
router.use('/jobs', jobRoutes);

router.get('/search', globalSearch);
router.post('/emailTest', emailTest);
router.post('/simpleEmailTest', simpleEmailTest);

export default router;
