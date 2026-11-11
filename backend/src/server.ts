import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import connectDatabase from './config/database.js';
import apiV1Router from './routes/index.js';
import errorHandler from './middleware/error.middleware.js';
import { seedDatabase } from './services/seed.service.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// 1. CORS & Core Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// 2. WebRTC Signaling Engine via Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[WebRTC Socket] Peer connected: ${socket.id}`);

  socket.on('join-room', (roomId: string, userDetails: any) => {
    socket.join(roomId);
    console.log(`[WebRTC] Peer ${socket.id} (${userDetails?.role || 'user'}) joined room: ${roomId}`);
    socket.to(roomId).emit('user-connected', { socketId: socket.id, userDetails });
  });

  socket.on('signal-offer', ({ targetSocketId, offer, senderDetails }) => {
    io.to(targetSocketId).emit('signal-offer', {
      senderSocketId: socket.id,
      offer,
      senderDetails
    });
  });

  socket.on('signal-answer', ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit('signal-answer', {
      senderSocketId: socket.id,
      answer
    });
  });

  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice-candidate', {
      senderSocketId: socket.id,
      candidate
    });
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('user-disconnected', { socketId: socket.id });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`[WebRTC Socket] Peer disconnected: ${socket.id}`);
  });
});

// 3. API Routes
app.use('/api/v1', apiV1Router);

// Health & System Info
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'Aarogya Drishti Autonomous Engine',
    version: '1.0.0-hackathon2026',
    timestamp: new Date().toISOString(),
    webrtcSignaling: 'ACTIVE',
    storageMode: 'Resilient Dual-Mode (Mongoose + In-Memory Persistence)'
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'AAROGYA DRISHTI — Oral Cancer Early Detection & Tele-Oncology Platform',
    edition: 'ITDA Paderu | Alluri Sitharama Raju District | Hackathon 2026',
    status: 'ONLINE',
    docs: '/api/v1/health',
    endpoints: {
      authQuickLogin: 'POST /api/v1/auth/patient-quick-login',
      phoneOtp: 'POST /api/v1/auth/phone-otp',
      verifyOtp: 'POST /api/v1/auth/verify-otp',
      registerPatient: 'POST /api/v1/auth/register-patient',
      analyzeOralPhoto: 'POST /api/v1/screenings/analyze-oral-photo',
      patientAppointments: 'GET /api/v1/appointments/patient/:uidn',
      requestAppointment: 'POST /api/v1/appointments/request',
      updateAppointmentStatus: 'PUT /api/v1/appointments/:id/status',
      prescriptions: 'GET /api/v1/prescriptions/:patientUidn',
      createPrescription: 'POST /api/v1/prescriptions/create',
      elevenMandalsHospitals: 'GET /api/v1/admin/11-mandals-hospitals',
      createDoctor: 'POST /api/v1/admin/doctors/create',
      omnibarSearch: 'GET /api/v1/search/omnibar?q=...'
    }
  });
});

app.use(errorHandler);

// 4. Server Initialization
let serverPromise: Promise<http.Server> | null = null;

export const startServer = async (): Promise<http.Server> => {
  if (server.listening) {
    return server;
  }
  if (serverPromise) {
    return serverPromise;
  }

  serverPromise = (async () => {
    try {
      await connectDatabase();
    } catch (err) {
      console.warn('[Server] Notice on database connection:', err);
    }

    // Pre-seed demo datasets immediately
    try {
      await seedDatabase();
    } catch (seedErr) {
      console.error('[Server] Seed initialization error:', seedErr);
    }

    return new Promise<http.Server>((resolve) => {
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`\n======================================================`);
        console.log(`🏥 AAROGYA DRISHTI ENGINE RUNNING ON PORT ${PORT}`);
        console.log(`🌐 Base URL: http://localhost:${PORT}`);
        console.log(`📡 WebRTC Signaling: ACTIVE on ws://localhost:${PORT}`);
        console.log(`🔍 Omnibar & Seed data ready for evaluation`);
        console.log(`======================================================\n`);
        resolve(server);
      });
    });
  })();

  return serverPromise;
};

startServer();

export { app, server, io };
