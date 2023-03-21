import express from 'express';
import {
  listSkills, listInterests, deleteInterest, deleteSkill
} from "../../controllers/admin/data.controller.js";

const router = express.Router();

router.post("/listSkills", listSkills);
router.post("/listInterests", listInterests);
router.delete('/deleteSkill/:modelId', deleteSkill);
router.delete('/deleteInterest/:modelId', deleteInterest);

export default router;