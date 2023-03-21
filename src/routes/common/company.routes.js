import express from 'express';

import {
  publicProfile, followCompany, unFollowCompany, companyFollowStats, companyRanking, instituteRanking
} from '../../controllers/common/company.controller.js';

const router = express.Router();

router.get('/publicProfile/:modelId', publicProfile);

router.delete('/follow/remove/:modelId', unFollowCompany);
router.get('/follow/stats/:modelId', companyFollowStats);
router.get('/follow/:modelId', followCompany);

router.get('/ranking/company/:modelId', companyRanking);
router.get('/ranking/institute/:modelId', instituteRanking);

export default router;