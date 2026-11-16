import { Router } from 'express';
import {
  get11MandalsHospitals,
  createHospital,
  createDoctor,
  getAllDoctors,
  updateDoctor,
  getPrescriptionsAudit
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/11-mandals-hospitals', get11MandalsHospitals);
router.get('/hospitals', get11MandalsHospitals);
router.post('/hospitals', createHospital);
router.get('/prescriptions-audit', getPrescriptionsAudit);
router.post('/doctors/create', createDoctor);
router.get('/doctors', getAllDoctors);
router.put('/doctors/:uidn', updateDoctor);

export default router;

