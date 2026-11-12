import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import store from '../services/store.service.js';
import { ASR_MANDALS } from '../models/Patient.js';

export const get11MandalsHospitals = async (_req: Request, res: Response): Promise<void> => {
  try {
    const hospitals = await store.findHospitals();
    
    // Group by mandal for administrative oversight
    const mandalSummary: Record<string, any> = {};
    for (const mandal of ASR_MANDALS) {
      const mandalHospitals = hospitals.filter((h) => h.mandal === mandal);
      mandalSummary[mandal] = {
        mandal,
        hospitalCount: mandalHospitals.length,
        facilities: mandalHospitals,
        totalActiveCases: mandalHospitals.reduce((acc, h) => acc + (h.caseSheetsRunning || 0), 0),
        biopsyEquipped: mandalHospitals.some((h) => h.biopsyEquipStatus === 'AVAILABLE')
      };
    }

    res.status(200).json({
      success: true,
      district: 'Alluri Sitharama Raju District (ITDA Paderu)',
      totalMandals: ASR_MANDALS.length,
      mandals: ASR_MANDALS,
      totalFacilities: hospitals.length,
      hospitals,
      mandalSummary
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      degreeCertificate,
      university,
      passingYear,
      relievingYear,
      experienceYears = 0,
      designation,
      hospitalDuty,
      abdmCode,
      email,
      phone,
      credentials = []
    } = req.body;

    if (!name || !degreeCertificate || !university || !designation || !hospitalDuty || !abdmCode || !email || !phone) {
      res.status(400).json({
        success: false,
        message: 'Compulsory fields missing: name, degreeCertificate, university, designation, hospitalDuty, abdmCode, email, phone.'
      });
      return;
    }

    const allDocs = await store.findDoctors();
    const docCount = allDocs.length + 1;
    // Allow custom Doctor ID provided by Admin or generate one
    const uidn = (req.body.uidn && String(req.body.uidn).trim())
      ? String(req.body.uidn).trim().toUpperCase()
      : `DOC-ASR-2026-${String(docCount).padStart(3, '0')}`;

    const plainPassword = (req.body.password && String(req.body.password).trim())
      ? String(req.body.password).trim()
      : 'Doctor@2026';
    const defaultPasswordHash = await bcrypt.hash(plainPassword, 10);

    const newDoctor = {
      uidn,
      name,
      degreeCertificate,
      university,
      passingYear: Number(passingYear) || new Date().getFullYear() - 5,
      relievingYear: relievingYear ? Number(relievingYear) : undefined,
      experienceYears: Number(experienceYears) || 0,
      designation,
      hospitalDuty,
      activeStatus: true,
      consultationsCount: 0,
      abdmCode: abdmCode || `ABDM-DOC-AP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: email.toLowerCase().trim(),
      phone: String(phone).trim(),
      credentials: Array.isArray(credentials) ? credentials : [credentials],
      password: plainPassword,
      passwordHash: defaultPasswordHash
    };

    const saved = await store.saveDoctor(newDoctor);

    await store.saveUser({
      email: saved.email,
      phone: saved.phone,
      role: 'doctor',
      uidn: saved.uidn,
      passwordHash: defaultPasswordHash,
      activeStatus: true
    });

    await store.logAction({
      actorId: 'ADMIN_SUPERUSER',
      role: 'admin',
      action: 'DOCTOR_ENROLLED',
      targetUidn: saved.uidn,
      details: { uidn: saved.uidn, name: saved.name, hospitalDuty: saved.hospitalDuty }
    });

    res.status(201).json({
      success: true,
      message: `Doctor ${saved.name} enrolled successfully with Login ID: ${uidn} and Password: ${plainPassword}`,
      doctor: saved
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllDoctors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const doctors = await store.findDoctors();
    res.status(200).json({
      success: true,
      doctors
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

