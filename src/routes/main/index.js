import express from 'express';
import authJwt from '../../middlewares/authJwt.js';
import userRoutes from './user.routes.js';
import feedRoutes from './feed.routes.js';
import experienceRoutes from './experience.routes.js';
import educationRoutes from './education.routes.js';
import projectRoutes from './project.routes.js';
import publicationRoutes from './publication.routes.js';
import rssNewsRoutes from './rssNews.routes.js';
import connectionRoutes from './connection.routes.js';
import companyRoutes from './company.routes.js';
import jobRoutes from './job.routes.js';
import chatRoutes from './chat.routes.js';
import memoRoutes from './memo.routes.js';

const router = express.Router();

router.use('/user', userRoutes);
router.use('/feed', feedRoutes);
router.use('/experience', [authJwt.isDefaultUser], experienceRoutes);
router.use('/education', [authJwt.isDefaultUser], educationRoutes);
router.use('/project', [authJwt.isDefaultUser], projectRoutes);
router.use('/publication', [authJwt.isDefaultUser], publicationRoutes);
router.use('/rssNews', [authJwt.isDefaultUser], rssNewsRoutes);
router.use('/connection', [authJwt.isDefaultUser], connectionRoutes);
router.use('/company', [authJwt.isDefaultUser], companyRoutes);
router.use('/jobs', [authJwt.isDefaultUser], jobRoutes);
router.use('/chat', [authJwt.isDefaultUser], chatRoutes);
router.use('/memo', [authJwt.isDefaultUser], memoRoutes);

export default router;