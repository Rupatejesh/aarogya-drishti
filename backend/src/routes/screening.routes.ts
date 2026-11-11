import { Router } from 'express';
import { analyzeOralPhoto, getScreeningsByPatient } from '../controllers/screening.controller.js';
import { uploadOralPhoto } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/analyze-oral-photo', uploadOralPhoto.single('photo'), analyzeOralPhoto);
router.get('/patient/:uidn', getScreeningsByPatient);

export default router;

