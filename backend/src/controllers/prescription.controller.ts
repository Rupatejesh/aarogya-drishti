import { Request, Response } from 'express';
import store from '../services/store.service.js';

export const getAllPrescriptions = async (req: Request, res: Response): Promise<void> => {
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

    const prescriptions = await store.findPrescriptions(query);
    res.status(200).json({
      success: true,
      prescriptions
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrescriptionsByPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientUidn } = req.params;
    const prescriptions = await store.findPrescriptions({ patientUidn });
    res.status(200).json({
      success: true,
      patientUidn,
      prescriptions
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientUidn,
      doctorUidn = 'DOC-ASR-2026-001',
      medicines = [],
      biopsyRecommended = false,
      biopsyProcedureDetails,
      trackingStatus = 'Prescription Dispensed',
      clinicalNotes
    } = req.body;

    if (!patientUidn) {
      res.status(400).json({ success: false, message: 'patientUidn is required' });
      return;
    }

    const rxId = `RX-ASR-2026-${Date.now().toString().slice(-4)}`;
    const printableBarcodeId = `BAR-ASR-2026-${Math.floor(10000 + Math.random() * 90000)}-${patientUidn.replace('UIDN-ASR-2026-', '')}`;

    const newPrescription = {
      rxId,
      patientUidn,
      doctorUidn,
      date: new Date(),
      medicines,
      biopsyRecommended: Boolean(biopsyRecommended),
      biopsyProcedureDetails: biopsyProcedureDetails || (biopsyRecommended ? 'Diagnostic oral punch biopsy advised.' : undefined),
      trackingStatus,
      printableBarcodeId,
      clinicalNotes
    };

    const saved = await store.savePrescription(newPrescription);

    await store.logAction({
      actorId: doctorUidn,
      role: 'doctor',
      action: 'PRESCRIPTION_GENERATED',
      targetUidn: patientUidn,
      details: { rxId, biopsyRecommended, trackingStatus, printableBarcodeId }
    });

    res.status(201).json({
      success: true,
      message: 'Prescription generated successfully with printable barcode verification.',
      prescription: saved
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, patientUidn } = req.params;
    const targetId = patientId || patientUidn;

    if (!targetId) {
      res.status(400).json({ success: false, message: 'patientId / UIDN parameter is required' });
      return;
    }

    const cleanId = String(targetId).trim();
    let patient = await store.findPatientByUidn(cleanId);
    if (!patient) {
      const allPatients = await store.findPatients();
      patient = allPatients.find(
        (p: any) =>
          p.uidn?.toLowerCase() === cleanId.toLowerCase() ||
          p.phone === cleanId ||
          p.aadhaar === cleanId
      );
    }

    const uidn = patient ? patient.uidn : cleanId;

    const [screenings, prescriptions, appointments] = await Promise.all([
      store.findScreenings({ patientUidn: uidn }),
      store.findPrescriptions({ patientUidn: uidn }),
      store.findAppointments({ patientUidn: uidn })
    ]);

    const timeline: any[] = [];

    screenings.forEach((s: any) => {
      timeline.push({
        id: s.screeningId || `sc-${s._id}`,
        type: 'screening',
        date: s.createdAt || s.date || new Date(),
        title: `AI Screening: ${s.aiCondition || 'Completed'}`,
        description: `Region: ${s.oralRegion} • Confidence: ${s.aiConfidenceScore || 90}% • Lesion: ${s.aiLesionType || 'Indurated Lesion'}`,
        badgeColor: s.aiCondition === 'Serious' || s.aiCondition === 'Urgent Clinical Evaluation' ? 'red' : s.aiCondition === 'Medium' ? 'amber' : 'emerald',
        data: s
      });
    });

    prescriptions.forEach((rx: any) => {
      timeline.push({
        id: rx.rxId || `rx-${rx._id}`,
        type: 'prescription',
        date: rx.date || rx.createdAt || new Date(),
        title: `e-Prescription: ${rx.rxId}`,
        description: `${rx.medicines?.length || 0} Medications • Status: ${rx.trackingStatus || 'Prescription Dispensed'}${rx.biopsyRecommended ? ' • Biopsy Recommended' : ''}`,
        badgeColor: rx.biopsyRecommended ? 'red' : 'blue',
        data: rx
      });
    });

    appointments.forEach((apt: any) => {
      timeline.push({
        id: apt.appointmentId || `apt-${apt._id}`,
        type: 'appointment',
        date: apt.appointmentDate || apt.createdAt || new Date(),
        title: `Appointment: ${apt.apptType || 'General Consultation'}`,
        description: `Facility: ${apt.hospitalName} • Slot: ${apt.timeSlot} • Status: ${apt.status}`,
        badgeColor: apt.status === 'APPROVED' ? 'emerald' : apt.status === 'REJECTED' ? 'red' : 'amber',
        data: apt
      });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.status(200).json({
      success: true,
      patientUidn: uidn,
      patient,
      screenings,
      prescriptions,
      appointments,
      timeline
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


