import { Router } from 'express';
import {
  getAllAppointments,
  getAppointmentsByPatient,
  requestAppointment,
  updateAppointmentStatus
} from '../controllers/appointment.controller.js';

const router = Router();

router.get('/', getAllAppointments);
router.get('/patient/:uidn', getAppointmentsByPatient);
router.post('/request', requestAppointment);
router.put('/:id/status', updateAppointmentStatus);

export default router;

