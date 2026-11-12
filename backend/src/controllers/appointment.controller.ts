import { Request, Response } from 'express';
import store from '../services/store.service.js';

export const getAllAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, doctorUidn } = req.query;
    let query: Record<string, any> = {};

    if (doctorId || doctorUidn) {
      const docCode = String(doctorId || doctorUidn).trim();
      query = {
        $or: [
          { doctorUidn: docCode },
          { doctorId: docCode }
        ]
      };
    }

    const appointments = await store.findAppointments(query);
    res.status(200).json({
      success: true,
      appointments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAppointmentsByDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const appointments = await store.findAppointments({
      $or: [
        { doctorUidn: doctorId },
        { doctorId: doctorId }
      ]
    });
    res.status(200).json({
      success: true,
      doctorId,
      appointments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAppointmentsByPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uidn } = req.params;
    const appointments = await store.findAppointments({ patientUidn: uidn });
    res.status(200).json({
      success: true,
      patientUidn: uidn,
      appointments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientUidn,
      doctorUidn,
      doctorName,
      mandal,
      hospitalName,
      apptType = 'General Oral Consultation',
      consultationMode = 'ONLINE',
      diseaseDiagnosed,
      appointmentDate,
      timeSlot = '10:00 AM - 10:30 AM',
      doctorRemarks
    } = req.body;

    if (!patientUidn || !mandal || !hospitalName || !appointmentDate) {
      res.status(400).json({
        success: false,
        message: 'patientUidn, mandal, hospitalName, and appointmentDate are required.'
      });
      return;
    }

    const apptDate = new Date(appointmentDate);
    const dayOfWeek = apptDate.toLocaleDateString('en-US', { weekday: 'long' });
    const appointmentId = `APT-ASR-2026-${Date.now().toString().slice(-4)}`;

    const newAppointment = {
      appointmentId,
      patientUidn,
      doctorUidn: doctorUidn || 'DOC-SWAPNA',
      doctorName: doctorName || 'Medical Officer',
      mandal,
      hospitalName,
      apptType,
      consultationMode: (consultationMode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE') as 'ONLINE' | 'OFFLINE',
      diseaseDiagnosed: diseaseDiagnosed || 'Suspected Oral Mucosal Lesion',
      appointmentDate: apptDate,
      dayOfWeek,
      timeSlot,
      status: 'PENDING',
      doctorRemarks: doctorRemarks || 'Tele-consultation / screening review requested by patient.'
    };

    const saved = await store.saveAppointment(newAppointment);

    await store.logAction({
      actorId: patientUidn,
      role: 'patient',
      action: 'APPOINTMENT_REQUESTED',
      targetUidn: patientUidn,
      details: { appointmentId, hospitalName, apptType }
    });

    res.status(201).json({
      success: true,
      message: 'Appointment requested successfully and queued for doctor confirmation.',
      appointment: saved
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, doctorRemarks } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be one of: PENDING, APPROVED, REJECTED'
      });
      return;
    }

    const updated = await store.updateAppointmentStatus(id, status, doctorRemarks);
    if (!updated) {
      res.status(404).json({
        success: false,
        message: `Appointment with ID ${id} not found.`
      });
      return;
    }

    await store.logAction({
      actorId: 'DOCTOR_DUTY',
      role: 'doctor',
      action: `APPOINTMENT_STATUS_UPDATED_${status}`,
      targetUidn: updated.patientUidn,
      details: { appointmentId: updated.appointmentId, status, remarks: doctorRemarks }
    });

    res.status(200).json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully.`,
      appointment: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
