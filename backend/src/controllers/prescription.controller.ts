import { Request, Response } from 'express';
import store from '../services/store.service.js';

export const getAllPrescriptions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const prescriptions = await store.findPrescriptions();
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

