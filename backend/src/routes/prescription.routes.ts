import { Router } from 'express';
import {
  getAllPrescriptions,
  getPrescriptionsByPatient,
  createPrescription
} from '../controllers/prescription.controller.js';

const router = Router();

router.get('/', getAllPrescriptions);
router.get('/:patientUidn', getPrescriptionsByPatient);
router.post('/create', createPrescription);

export default router;

