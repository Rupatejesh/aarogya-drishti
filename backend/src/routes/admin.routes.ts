import { Router } from 'express';
import {
  get11MandalsHospitals,
  createDoctor,
  getAllDoctors,
  updateDoctor
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/11-mandals-hospitals', get11MandalsHospitals);
router.post('/doctors/create', createDoctor);
router.get('/doctors', getAllDoctors);
router.put('/doctors/:uidn', updateDoctor);

export default router;

