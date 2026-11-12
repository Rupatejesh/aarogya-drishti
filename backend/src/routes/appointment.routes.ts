import { Router } from 'express';
import {
  getAllAppointments,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  requestAppointment,
  updateAppointmentStatus,
  getActiveCallByPatient,
  registerActiveCall,
  endActiveCall
} from '../controllers/appointment.controller.js';

const router = Router();

router.get('/', getAllAppointments);
router.get('/active-call/:patientUidn', getActiveCallByPatient);
router.post('/active-call', registerActiveCall);
router.delete('/active-call/:patientUidn', endActiveCall);
router.get('/patient/:uidn', getAppointmentsByPatient);
router.get('/doctor/:doctorId', getAppointmentsByDoctor);
router.post('/request', requestAppointment);
router.put('/:id/status', updateAppointmentStatus);

export default router;

