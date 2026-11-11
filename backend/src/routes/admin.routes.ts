import { Router } from 'express';
import {
  get11MandalsHospitals,
  createDoctor,
  getAllDoctors
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/11-mandals-hospitals', get11MandalsHospitals);
router.post('/doctors/create', createDoctor);
router.get('/doctors', getAllDoctors);

export default router;

