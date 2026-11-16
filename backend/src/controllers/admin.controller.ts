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

export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorUidn = String(req.params.uidn || '').trim();
    if (!doctorUidn) {
      res.status(400).json({ success: false, message: 'Doctor UIDN is required.' });
      return;
    }

    const existingDoctor = await store.findDoctorByUidn(doctorUidn);
    if (!existingDoctor) {
      res.status(404).json({ success: false, message: `Doctor with UIDN ${doctorUidn} not found.` });
      return;
    }

    const {
      name,
      designation,
      hospitalDuty,
      mandal,
      status, // 'Active' | 'Inactive' | 'On Visit'
      phone,
      email,
      password,
      experienceYears,
      degreeCertificate,
      university
    } = req.body;

    const updatedData: any = { ...existingDoctor };

    if (name) updatedData.name = name.trim();
    if (designation) updatedData.designation = designation.trim();
    if (hospitalDuty) updatedData.hospitalDuty = hospitalDuty.trim();
    if (mandal) updatedData.mandal = mandal.trim();
    if (status && ['Active', 'Inactive', 'On Visit'].includes(status)) {
      updatedData.status = status;
      updatedData.activeStatus = status !== 'Inactive';
    }
    if (phone) updatedData.phone = String(phone).trim();
    if (email) updatedData.email = String(email).trim().toLowerCase();
    if (experienceYears !== undefined) updatedData.experienceYears = Number(experienceYears) || 0;
    if (degreeCertificate) updatedData.degreeCertificate = degreeCertificate.trim();
    if (university) updatedData.university = university.trim();

    // If new password provided, hash and update user record as well
    if (password && String(password).trim().length > 0) {
      const plainPassword = String(password).trim();
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      updatedData.password = plainPassword;
      updatedData.passwordHash = passwordHash;

      await store.saveUser({
        email: updatedData.email,
        phone: updatedData.phone,
        role: 'doctor',
        uidn: updatedData.uidn,
        passwordHash,
        activeStatus: updatedData.activeStatus
      });
    } else {
      // Sync user model active status and contacts
      await store.saveUser({
        email: updatedData.email,
        phone: updatedData.phone,
        role: 'doctor',
        uidn: updatedData.uidn,
        activeStatus: updatedData.activeStatus
      });
    }

    const savedDoctor = await store.saveDoctor(updatedData);

    await store.logAction({
      actorId: 'ADMIN_SUPERUSER',
      role: 'admin',
      action: 'DOCTOR_UPDATED',
      targetUidn: savedDoctor.uidn,
      details: {
        uidn: savedDoctor.uidn,
        name: savedDoctor.name,
        status: savedDoctor.status,
        mandal: savedDoctor.mandal,
        hospitalDuty: savedDoctor.hospitalDuty
      }
    });

    res.status(200).json({
      success: true,
      message: `Doctor ${savedDoctor.name} updated successfully.`,
      doctor: savedDoctor
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      mandal,
      facilityType,
      abdmFacilityCode,
      address,
      phone,
      moInCharge,
      bloodBankAvailable = false,
      ambulance108_104_Unit = true,
      biopsyEquipStatus = 'AVAILABLE',
      caseSheetsRunning = 0,
      caseSheetsDischarged = 0,
      availableSpecialists,
      telemedicineReady = true
    } = req.body;

    if (!name || !mandal || !facilityType) {
      res.status(400).json({
        success: false,
        message: 'Compulsory fields missing: name, mandal, facilityType.'
      });
      return;
    }

    const code = abdmFacilityCode && abdmFacilityCode.trim().length > 0
      ? abdmFacilityCode.trim().toUpperCase()
      : `ABDM-HOSP-ASR-${Date.now().toString().slice(-4)}`;

    const newHospital = {
      hospitalId: code,
      name: name.trim(),
      mandal: mandal.trim(),
      facilityType: facilityType.trim(),
      abdmFacilityCode: code,
      moInCharge: moInCharge?.trim() || 'Medical Officer In-Charge',
      bloodBankAvailable: Boolean(bloodBankAvailable),
      ambulance108_104_Unit: Boolean(ambulance108_104_Unit),
      biopsyEquipStatus: biopsyEquipStatus || 'AVAILABLE',
      caseSheetsRunning: Number(caseSheetsRunning) || 0,
      caseSheetsDischarged: Number(caseSheetsDischarged) || 0,
      phone: phone?.trim() || '08935-234201',
      address: address?.trim() || `${mandal} Agency Area, ASR District`,
      availableSpecialists: availableSpecialists || 'Oral Onco-Specialist & Medical Officer',
      telemedicineReady: Boolean(telemedicineReady)
    };

    const saved = await store.saveHospital(newHospital);

    await store.logAction({
      actorId: 'ITDA_ADMIN',
      role: 'admin',
      action: 'HOSPITAL_FACILITY_ADDED',
      targetUidn: code,
      details: { name: saved.name, mandal: saved.mandal, facilityType: saved.facilityType }
    });

    res.status(201).json({
      success: true,
      message: 'New hospital facility added to 11 Mandals Registry successfully.',
      hospital: saved
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrescriptionsAudit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mandal, status, search } = req.query;

    const [prescriptions, patients, doctors, screenings] = await Promise.all([
      store.findPrescriptions(),
      store.findPatients(),
      store.findDoctors(),
      store.findScreenings()
    ]);

    const patientMap = new Map(patients.map((p: any) => [p.uidn, p]));
    const doctorMap = new Map(doctors.map((d: any) => [d.uidn, d]));
    const screeningMap = new Map(screenings.map((s: any) => [s.patientUidn, s]));

    let auditRecords = prescriptions.map((rx: any) => {
      const patient = patientMap.get(rx.patientUidn) || {};
      const doctor = doctorMap.get(rx.doctorUidn) || {};
      const latestScreening = screeningMap.get(rx.patientUidn);

      return {
        ...rx,
        patientName: patient.name || rx.patientUidn,
        patientAge: patient.age,
        patientGender: patient.gender,
        patientPhone: patient.phone,
        mandal: patient.mandal || doctor.hospitalDuty || 'Paderu',
        village: patient.village || 'Agency Village',
        doctorName: doctor.name || rx.doctorUidn,
        doctorHospital: doctor.hospitalDuty || 'Area Hospital Paderu',
        screeningRisk: latestScreening?.aiCondition || (rx.biopsyRecommended ? 'Serious' : 'Medium'),
        screeningConfidence: latestScreening?.aiConfidenceScore || 90,
        screeningLesion: latestScreening?.aiLesionType || 'Indurated Lesion'
      };
    });

    if (mandal && String(mandal) !== 'all' && String(mandal) !== 'All 11 Mandals') {
      auditRecords = auditRecords.filter((r) => r.mandal?.toLowerCase() === String(mandal).toLowerCase());
    }

    if (status && String(status) !== 'all') {
      auditRecords = auditRecords.filter((r) => r.trackingStatus?.toLowerCase() === String(status).toLowerCase());
    }

    if (search && String(search).trim().length > 0) {
      const term = String(search).toLowerCase().trim();
      auditRecords = auditRecords.filter(
        (r) =>
          r.rxId?.toLowerCase().includes(term) ||
          r.patientUidn?.toLowerCase().includes(term) ||
          r.patientName?.toLowerCase().includes(term) ||
          r.printableBarcodeId?.toLowerCase().includes(term) ||
          r.doctorName?.toLowerCase().includes(term) ||
          r.mandal?.toLowerCase().includes(term)
      );
    }

    auditRecords.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

    const totalPrescriptions = auditRecords.length;
    const biopsyScheduledCount = auditRecords.filter((r) => r.biopsyRecommended || r.trackingStatus === 'Biopsy Scheduled').length;
    const dispensingCount = auditRecords.filter((r) => r.trackingStatus === 'Prescription Dispensed').length;

    res.status(200).json({
      success: true,
      totalPrescriptions,
      biopsyScheduledCount,
      dispensingCount,
      records: auditRecords
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};



