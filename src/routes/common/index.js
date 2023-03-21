import express from 'express';
import userRoutes from './user.routes.js';
import companyRoutes from './company.routes.js';
import projectRoutes from './project.routes.js';
import experienceRoutes from './experience.routes.js';

import {
    test, globalSearch
  } from '../../controllers/common/common.controller.js';

const router = express.Router();

router.use('/user', userRoutes);
router.use('/company', companyRoutes);
router.use('/project', projectRoutes);
router.use('/experience', experienceRoutes);

router.get('/search', globalSearch);
router.get('/test', test);

export default router;
