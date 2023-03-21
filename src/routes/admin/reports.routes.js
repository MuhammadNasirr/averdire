import express from 'express';
import { users, verifiedUsers, activeUsers } from '../../controllers/admin/reports/user.controller.js';
import { companies, verifiedCompanies, institutes } from '../../controllers/admin/reports/company.controller.js';
import { publications } from '../../controllers/admin/reports/publication.controller.js';
import { news } from '../../controllers/admin/reports/news.controller.js';

const router = express.Router();

router.post('/user/all', users);
router.post('/users/verified', verifiedUsers);
router.post('/users/active', activeUsers);

router.post('/company/all', companies);
router.post('/company/verified', verifiedCompanies);
router.post('/institute/all', institutes);

router.post('/publication/all', publications);

router.post('/news/all', news);

export default router;
