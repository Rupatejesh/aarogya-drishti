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

// Global in-memory Active Consultation Call Registry
export const activeConsultationCalls = new Map<string, any>();

export const getActiveCallByPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientUidn = String(req.params.patientUidn || '');
    const callData = activeConsultationCalls.get(patientUidn) || null;
    res.status(200).json({
      success: true,
      activeCall: callData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerActiveCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientUidn, doctorUidn, doctorName, roomId } = req.body;
    if (!patientUidn || !roomId) {
      res.status(400).json({ success: false, message: 'patientUidn and roomId required' });
      return;
    }
    const callData = {
      patientUidn: String(patientUidn),
      doctorUidn: doctorUidn ? String(doctorUidn) : undefined,
      doctorName: doctorName ? String(doctorName) : undefined,
      roomId: String(roomId),
      startedAt: Date.now()
    };
    activeConsultationCalls.set(String(patientUidn), callData);
    res.status(200).json({ success: true, activeCall: callData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endActiveCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientUidn = String(req.params.patientUidn || '');
    activeConsultationCalls.delete(patientUidn);
    res.status(200).json({ success: true, message: 'Active call cleared' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const DEFAULT_OPD_SLOTS = [
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '10:30 AM - 11:00 AM',
  '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM',
  '03:00 PM - 03:30 PM',
  '04:00 PM - 04:30 PM'
];

export const getDoctorAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = String(req.params.doctorId || req.params.doctorUidn || '').trim();
    const queryDate = req.query.date ? String(req.query.date).trim() : new Date().toISOString().split('T')[0];

    const allDoctors = await store.findDoctors();
    const doctor = (await store.findDoctorByUidn(doctorId)) || allDoctors.find((d: any) => d.uidn === doctorId || d.doctorId === doctorId);

    // Find all appointments for this doctor on queryDate
    const allAppointments = await store.findAppointments({
      $or: [{ doctorUidn: doctorId }, { doctorId }]
    });

    const bookedOnDate = allAppointments.filter((a: any) => {
      if (a.status === 'REJECTED') return false;
      if (!a.appointmentDate) return false;
      const aDate = new Date(a.appointmentDate).toISOString().split('T')[0];
      return aDate === queryDate;
    });

    const bookedTimeSlots = new Map<string, any>();
    bookedOnDate.forEach((a: any) => {
      if (a.timeSlot) {
        bookedTimeSlots.set(a.timeSlot.trim(), a);
      }
    });

    // Check if doctor has custom configured availability for queryDate
    const customDaySlots = doctor?.availabilitySlots?.filter((s: any) => s.date === queryDate) || [];

    let configuredSlots: string[] = [];
    if (customDaySlots.length > 0) {
      configuredSlots = customDaySlots.filter((s: any) => s.isAvailable !== false).map((s: any) => s.timeSlot);
    } else {
      configuredSlots = [...DEFAULT_OPD_SLOTS];
    }

    const dayName = new Date(queryDate).toLocaleDateString('en-US', { weekday: 'long' });

    const slots = configuredSlots.map((timeSlot) => {
      const bookedAppt = bookedTimeSlots.get(timeSlot.trim());
      return {
        timeSlot,
        isAvailable: !bookedAppt,
        isBooked: !!bookedAppt,
        bookedPatientUidn: bookedAppt?.patientUidn || null,
        appointmentId: bookedAppt?.appointmentId || null
      };
    });

    const freeSlots = slots.filter((s) => s.isAvailable).map((s) => s.timeSlot);

    res.status(200).json({
      success: true,
      doctorUidn: doctorId,
      doctorName: doctor?.name || 'Consultant Specialist',
      hospitalDuty: doctor?.hospitalDuty || 'Area Hospital',
      date: queryDate,
      dayOfWeek: dayName,
      isCustomSchedule: customDaySlots.length > 0,
      totalSlots: slots.length,
      freeSlotsCount: freeSlots.length,
      slots,
      freeSlots
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoctorAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = String(req.params.doctorId || req.params.doctorUidn || '').trim();
    const { date, slots } = req.body;

    if (!doctorId || !date || !slots || !Array.isArray(slots)) {
      res.status(400).json({
        success: false,
        message: 'doctorId, date (YYYY-MM-DD), and slots array are required.'
      });
      return;
    }

    const allDoctors = await store.findDoctors();
    let doctor = (await store.findDoctorByUidn(doctorId)) || allDoctors.find((d: any) => d.uidn === doctorId || d.doctorId === doctorId);
    if (!doctor) {
      doctor = {
        uidn: doctorId,
        name: doctorId === 'DOC-ANIL' ? 'Dr. Anil Kumar, MBBS, MS' : `Doctor ${doctorId}`,
        hospitalDuty: 'Area Hospital Chintapalli / GGH Paderu Tele-Lab Hub',
        designation: 'Specialist Tele-Consultant',
        activeStatus: true,
        abdmCode: `ABDM-${doctorId}`,
        availabilitySlots: []
      };
    }

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    const existingSlots = (doctor.availabilitySlots || []).filter((s: any) => s.date !== date);

    const newSlots = slots.map((s: any) => {
      if (typeof s === 'string') {
        return {
          date,
          dayOfWeek: dayName,
          timeSlot: s.trim(),
          isAvailable: true,
          maxPatients: 1
        };
      }
      return {
        date,
        dayOfWeek: dayName,
        timeSlot: s.timeSlot.trim(),
        isAvailable: s.isAvailable !== false,
        maxPatients: s.maxPatients || 1
      };
    });

    doctor.availabilitySlots = [...existingSlots, ...newSlots];
    await store.saveDoctor(doctor);

    await store.logAction({
      actorId: doctorId,
      role: 'doctor',
      action: 'DOCTOR_AVAILABILITY_UPDATED',
      targetUidn: doctorId,
      details: { date, slotsCount: newSlots.length }
    });

    res.status(200).json({
      success: true,
      message: `Availability slots updated successfully for ${date}.`,
      doctorUidn: doctorId,
      date,
      slots: newSlots
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
