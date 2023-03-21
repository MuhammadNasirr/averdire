import multer from "multer";
import express from 'express';
import {
  update, profile, updateLogo, updateCover, listDepartments, createDepartment,
  updateDepartment, viewDepartment, dltDepartment
} from "../../controllers/company/company.controller.js";

const router = express.Router();
var upload = multer({ dest: 'uploads/company/logo' });
var coverUpload = multer({ dest: 'uploads/company/cover' });

router.get("/profile", profile);
router.put("/update", [upload.any()], update);
router.post('/updateLogo', [
  upload.fields([
    { name: 'logo', maxCount: 1 }
  ])
], updateLogo);
router.post('/updateCover', [
  coverUpload.fields([
    { name: 'cover', maxCount: 1 }
  ])
], updateCover);

router.get('/department/list', listDepartments);
router.post('/department/create', [upload.any()], createDepartment);
router.put('/department/update/:modelId', [upload.any()], updateDepartment);
router.get('/department/view/:modelId', viewDepartment);
router.delete('/department/delete/:modelId', dltDepartment);

export default router;