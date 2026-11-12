import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately before any other module imports
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import connectDatabase from './config/database.js';
import apiV1Router from './routes/index.js';
import errorHandler from './middleware/error.middleware.js';
import { seedDatabase } from './services/seed.service.js';
import { activeConsultationCalls } from './controllers/appointment.controller.js';

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// 1. CORS & Core Middlewares
app.use(
  cors()
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

  // Room-broadcast WebRTC signaling
  socket.on('offer', (data: { roomId: string; offer: any; senderDetails?: any }) => {
    socket.to(data.roomId).emit('offer', {
      offer: data.offer,
      senderSocketId: socket.id,
      senderDetails: data.senderDetails
    });
  });

  socket.on('answer', (data: { roomId: string; answer: any }) => {
    socket.to(data.roomId).emit('answer', {
      answer: data.answer,
      senderSocketId: socket.id
    });
  });

  socket.on('signal-offer', ({ targetSocketId, offer, senderDetails, roomId }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit('signal-offer', {
        senderSocketId: socket.id,
        offer,
        senderDetails
      });
    } else if (roomId) {
      socket.to(roomId).emit('signal-offer', {
        senderSocketId: socket.id,
        offer,
        senderDetails
      });
    }
  });

  socket.on('signal-answer', ({ targetSocketId, answer, roomId }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit('signal-answer', {
        senderSocketId: socket.id,
        answer
      });
    } else if (roomId) {
      socket.to(roomId).emit('signal-answer', {
        senderSocketId: socket.id,
        answer
      });
    }
  });

  socket.on('ice-candidate', ({ targetSocketId, candidate, roomId }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        senderSocketId: socket.id,
        candidate
      });
    } else if (roomId) {
      socket.to(roomId).emit('ice-candidate', {
        senderSocketId: socket.id,
        candidate
      });
    }
  });

  socket.on('send-message', ({ roomId, message }) => {
    socket.to(roomId).emit('receive-message', message);
  });

  socket.on('video-frame', ({ roomId, frame, senderRole }) => {
    socket.to(roomId).emit('video-frame', { frame, senderRole });
  });

  socket.on('audio-chunk', ({ roomId, chunk, mimeType, senderRole }) => {
    socket.to(roomId).emit('audio-chunk', { chunk, mimeType, senderRole });
  });

  socket.on('call-started', ({ patientUidn, doctorUidn, doctorName, roomId }) => {
    console.log(`[WebRTC] Doctor ${doctorName} started call for patient ${patientUidn} in ${roomId}`);
    if (patientUidn && roomId) {
      activeConsultationCalls.set(patientUidn, {
        patientUidn,
        doctorUidn,
        doctorName,
        roomId,
        startedAt: Date.now()
      });
    }
    io.emit('doctor-calling-patient', { patientUidn, doctorUidn, doctorName, roomId });
  });

  socket.on('end-consultation', ({ roomId, endedBy, patientUidn }) => {
    console.log(`[WebRTC] Consultation ended in room ${roomId} by ${endedBy || 'peer'}`);
    if (patientUidn) {
      activeConsultationCalls.delete(patientUidn);
    } else if (roomId) {
      for (const [pUid, call] of activeConsultationCalls.entries()) {
        if (call.roomId === roomId) {
          activeConsultationCalls.delete(pUid);
        }
      }
    }
    socket.to(roomId).emit('consultation-ended', { endedBy, roomId });
    io.emit('consultation-ended', { endedBy, roomId });
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
