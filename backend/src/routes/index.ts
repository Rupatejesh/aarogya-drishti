import { Router } from 'express';
import authRoutes from './auth.routes.js';
import screeningRoutes from './screening.routes.js';
import appointmentRoutes from './appointment.routes.js';
import prescriptionRoutes from './prescription.routes.js';
import adminRoutes from './admin.routes.js';
import searchRoutes from './search.routes.js';

const apiV1Router = Router();

apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/screenings', screeningRoutes);
apiV1Router.use('/appointments', appointmentRoutes);
apiV1Router.use('/prescriptions', prescriptionRoutes);
apiV1Router.use('/admin', adminRoutes);
apiV1Router.use('/search', searchRoutes);

export default apiV1Router;

