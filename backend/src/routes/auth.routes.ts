import { Router } from 'express';
import {
  patientQuickLogin,
  sendPhoneOtp,
  verifyPhoneOtp,
  registerPatient,
  aadharLogin,
  doctorLogin,
  doctorResetPassword
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/patient-quick-login', patientQuickLogin);
router.post('/phone-otp', sendPhoneOtp);
router.post('/verify-otp', verifyPhoneOtp);
router.post('/register-patient', registerPatient);
router.post('/aadhar-login', aadharLogin);
router.post('/doctor-login', doctorLogin);
router.post('/doctor-reset-password', doctorResetPassword);

export default router;

