import { Router } from 'express';
import {
  getAllPrescriptions,
  getPrescriptionsByPatient,
  createPrescription,
  getPatientHistory
} from '../controllers/prescription.controller.js';

const router = Router();

router.get('/', getAllPrescriptions);
router.post('/', createPrescription);
router.post('/create', createPrescription);
router.get('/history/:patientId', getPatientHistory);
router.get('/:patientUidn', getPrescriptionsByPatient);

export default router;

