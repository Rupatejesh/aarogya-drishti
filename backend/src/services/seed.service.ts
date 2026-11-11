import bcrypt from 'bcryptjs';
import store from './store.service.js';

export const seedDatabase = async (): Promise<void> => {
  console.log('[Seed] Initializing enterprise seed dataset for ITDA Paderu Hackathon 2026...');

  const defaultPasswordHash = await bcrypt.hash('Aarogya@2026', 10);

  // 1. SEED HOSPITALS ACROSS ALL 11 MANDALS
  const hospitals = [
    {
      name: 'Area Hospital Paderu (AH Paderu / District Hub)',
      mandal: 'Paderu',
      abdmFacilityCode: 'ASR-HOSP-001',
      facilityType: 'AH',
      moInCharge: 'Dr. B. Satyanarayana, MS',
      bloodBankAvailable: true,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'AVAILABLE',
      caseSheetsRunning: 42,
      caseSheetsDischarged: 188,
      phone: '08935-250021'
    },
    {
      name: 'Community Health Centre Araku Valley',
      mandal: 'Araku Valley',
      abdmFacilityCode: 'ASR-HOSP-002',
      facilityType: 'CHC',
      moInCharge: 'Dr. K. Anuradha, MD',
      bloodBankAvailable: true,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'AVAILABLE',
      caseSheetsRunning: 28,
      caseSheetsDischarged: 94,
      phone: '08936-249012'
    },
    {
      name: 'Primary Health Centre Dumbriguda',
      mandal: 'Dumbriguda',
      abdmFacilityCode: 'ASR-HOSP-003',
      facilityType: 'PHC',
      moInCharge: 'Dr. N. Prasad, MBBS',
      bloodBankAvailable: false,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'REFERRAL_REQUIRED',
      caseSheetsRunning: 14,
      caseSheetsDischarged: 45,
      phone: '08936-241103'
    },
    {
      name: 'Primary Health Centre Ananthagiri',
      mandal: 'Ananthagiri',
      abdmFacilityCode: 'ASR-HOSP-004',
      facilityType: 'PHC',
      moInCharge: 'Dr. M. Sailaja, MBBS',
      bloodBankAvailable: false,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'REFERRAL_REQUIRED',
      caseSheetsRunning: 12,
      caseSheetsDischarged: 50,
      phone: '08936-248204'
    },
    {
      name: 'Primary Health Centre Hukumpeta',
      mandal: 'Hukumpeta',
      abdmFacilityCode: 'ASR-HOSP-005',
      facilityType: 'PHC',
      moInCharge: 'Dr. G. Suresh, MBBS',
      bloodBankAvailable: false,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'REFERRAL_REQUIRED',
      caseSheetsRunning: 16,
      caseSheetsDischarged: 62,
      phone: '08935-252105'
    },
    {
      name: 'Primary Health Centre Pedabayalu',
      mandal: 'Pedabayalu',
      abdmFacilityCode: 'ASR-HOSP-006',
      facilityType: 'PHC',
      moInCharge: 'Dr. V. Lavanya, MBBS',
      bloodBankAvailable: false,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'REFERRAL_REQUIRED',
      caseSheetsRunning: 18,
      caseSheetsDischarged: 55,
      phone: '08935-254106'
    },
    {
      name: 'Primary Health Centre Munchingi Puttu',
      mandal: 'Munchingi Puttu',
      abdmFacilityCode: 'ASR-HOSP-007',
      facilityType: 'PHC',
      moInCharge: 'Dr. C. Harish, MBBS',
      bloodBankAvailable: false,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'REFERRAL_REQUIRED',
      caseSheetsRunning: 15,
      caseSheetsDischarged: 48,
      phone: '08935-255107'
    },
    {
      name: 'Community Health Centre G. Madugula',
      mandal: 'G. Madugula',
      abdmFacilityCode: 'ASR-HOSP-008',
      facilityType: 'CHC',
      moInCharge: 'Dr. P. Vani, BDS MDS',
      bloodBankAvailable: true,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'AVAILABLE',
      caseSheetsRunning: 31,
      caseSheetsDischarged: 110,
      phone: '08935-256108'
    },
    {
      name: 'Community Health Centre Chintapalle',
      mandal: 'Chintapalle',
      abdmFacilityCode: 'ASR-HOSP-009',
      facilityType: 'CHC',
      moInCharge: 'Dr. T. Dharma Rao, MS',
      bloodBankAvailable: true,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'AVAILABLE',
      caseSheetsRunning: 26,
      caseSheetsDischarged: 89,
      phone: '08937-251109'
    },
    {
      name: 'Primary Health Centre G.K. Veedhi',
      mandal: 'G.K. Veedhi',
      abdmFacilityCode: 'ASR-HOSP-010',
      facilityType: 'PHC',
      moInCharge: 'Dr. R. Trinadh, MBBS',
      bloodBankAvailable: false,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'REFERRAL_REQUIRED',
      caseSheetsRunning: 11,
      caseSheetsDischarged: 39,
      phone: '08937-253110'
    },
    {
      name: 'Primary Health Centre Koyyuru',
      mandal: 'Koyyuru',
      abdmFacilityCode: 'ASR-HOSP-011',
      facilityType: 'PHC',
      moInCharge: 'Dr. S. Devender, MBBS',
      bloodBankAvailable: false,
      ambulance108_104_Unit: true,
      biopsyEquipStatus: 'REFERRAL_REQUIRED',
      caseSheetsRunning: 13,
      caseSheetsDischarged: 41,
      phone: '08937-257111'
    }
  ];

  for (const h of hospitals) {
    await store.saveHospital(h);
  }

  // 2. SEED DOCTORS
  const doctors = [
    {
      uidn: 'DOC-SWAPNA',
      name: 'Dr. Swapna Devi, MDS',
      degreeCertificate: 'MDS Oral & Maxillofacial Pathology - AMC Vizag (2011)',
      university: 'Andhra Medical College / Dr. NTR UHS',
      passingYear: 2011,
      relievingYear: 2014,
      experienceYears: 15,
      designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
      hospitalDuty: 'Area Hospital Paderu / GGH Paderu Tele-Lab Hub',
      activeStatus: true,
      consultationsCount: 142,
      abdmCode: 'ABDM-DOC-AP-7821',
      email: 'dr.swapna@aarogyadrishti.org',
      phone: '9848011221',
      credentials: ['Fellow IAOO', 'Certified Cytopathologist ITDA Paderu', 'ABDM Registered Specialist']
    },
    {
      uidn: 'DOC-RAJESH',
      name: 'Dr. K. Rajesh, MS ENT',
      degreeCertificate: 'MS Otorhinolaryngology & Head-Neck Surgery - KGH AMC (2012)',
      university: 'King George Hospital / Andhra Medical College',
      passingYear: 2012,
      relievingYear: 2015,
      experienceYears: 14,
      designation: 'Head & Neck Surgical Oncologist',
      hospitalDuty: 'Area Hospital Paderu (AH Paderu / District Hub)',
      activeStatus: true,
      consultationsCount: 115,
      abdmCode: 'ABDM-DOC-AP-9011',
      email: 'dr.rajesh@aarogyadrishti.org',
      phone: '9848011223',
      credentials: ['Microvascular Onco-Reconstruction Expert', 'Punch Biopsy Specialist']
    },
    {
      uidn: 'DOC-ANAND',
      name: 'Dr. Anand Kumar, MDS',
      degreeCertificate: 'MDS Oral Medicine & Radiology - Govt Dental College Vijayawada (2016)',
      university: 'Government Dental College & Hospital, Vijayawada',
      passingYear: 2016,
      relievingYear: 2019,
      experienceYears: 10,
      designation: 'Senior Oral Medicine Specialist & Tobacco Cessation Lead',
      hospitalDuty: 'Community Health Centre G. Madugula',
      activeStatus: true,
      consultationsCount: 98,
      abdmCode: 'ABDM-DOC-AP-4402',
      email: 'dr.anand@aarogyadrishti.org',
      phone: '9848011222',
      credentials: ['Tobacco Intervention Specialist', 'Oral Precancer Screening Lead ASR']
    }
  ];

  for (const doc of doctors) {
    await store.saveDoctor(doc);
    await store.saveUser({
      email: doc.email,
      phone: doc.phone,
      role: 'doctor',
      uidn: doc.uidn,
      passwordHash: defaultPasswordHash,
      activeStatus: true
    });
  }

  // 3. SEED COMPULSORY HACKATHON PATIENT: K. SOMANNA
  const somanna = {
    uidn: 'UIDN-ASR-2026-GM046',
    name: 'K. Somanna',
    dob: new Date('1980-04-12'),
    age: 46,
    gender: 'MALE',
    bloodGroup: 'O+',
    phone: '9490123451',
    aadhar: '6543-8901-2345',
    mandal: 'G. Madugula',
    village: 'Nurmati',
    habitation: 'G. Madugula Tribal Hamlet',
    photoUrl: '/uploads/k_somanna_oral.jpg',
    consentTimestamp: new Date('2026-11-01T09:30:00Z')
  };
  await store.savePatient(somanna);
  await store.saveUser({
    phone: somanna.phone,
    aadhar: somanna.aadhar,
    role: 'patient',
    uidn: somanna.uidn,
    passwordHash: defaultPasswordHash,
    activeStatus: true
  });

  // Seed K. Somanna Screening (Compulsory Evaluation Scenario)
  const somannaScreening = {
    screeningId: 'SCR-ASR-2026-GM046',
    patientUidn: somanna.uidn,
    oralRegion: 'Right Buccal Mucosa',
    imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600',
    symptomsChecklist: [
      'Persistent non-scrapable white cheek patch on right buccal mucosa (>3 weeks)',
      'Mild burning sensation upon spicy food intake',
      'Indurated and rough granular mucosal border'
    ],
    habitExposure: {
      tobacco: true,
      gutkha: false,
      reverseSmoking: true,
      areca: true,
      years: 18,
      frequency: '6-8 times daily with chewing tobacco'
    },
    aiCondition: 'Serious',
    aiConfidenceScore: 92.4,
    aiLesionType: 'Oral Leukoplakia',
    boundingBoxCoordinates: {
      xmin: 220,
      ymin: 160,
      xmax: 540,
      ymax: 480
    },
    clinicalRemarks: 'AI Model predicts serious condition with 92.4% accuracy, flags Oral Leukoplakia on right buccal mucosa. Biopsy recommended immediately at PHC G. Madugula.'
  };
  await store.saveScreening(somannaScreening);

  // Seed K. Somanna Appointment (Saturday 10:30 AM at PHC G. Madugula approved by Dr. Swapna Devi)
  const somannaAppointment = {
    appointmentId: 'APT-ASR-2026-GM046',
    patientUidn: somanna.uidn,
    doctorUidn: 'DOC-SWAPNA',
    mandal: 'G. Madugula',
    hospitalName: 'PHC G. Madugula',
    apptType: 'Biopsy Procedure Appointment',
    appointmentDate: new Date('2026-11-14T10:30:00Z'),
    dayOfWeek: 'Saturday',
    timeSlot: 'Saturday 10:30 AM',
    status: 'APPROVED',
    doctorRemarks: 'Approved by Dr. Swapna Devi, MDS for Saturday 10:30 AM at PHC G. Madugula for 4mm punch biopsy procedure.'
  };
  await store.saveAppointment(somannaAppointment);

  // Seed K. Somanna Prescription & Biopsy Order (Histopathology referral to GGH Paderu)
  const somannaPrescription = {
    rxId: 'RX-ASR-2026-GM046',
    patientUidn: somanna.uidn,
    doctorUidn: 'DOC-SWAPNA',
    date: new Date(Date.now() + 10000), // Ensures latest onco-referral slip is top
    medicines: [
      {
        name: 'Antioxidant & Lycopene Capsules (LycoRed 8mg)',
        dosage: '1 capsule',
        frequency: 'Twice daily after meals',
        duration: '30 days',
        instructions: 'Swallow whole with warm water. Do not chew.'
      },
      {
        name: 'Triamcinolone Acetonide Oral Paste 0.1% (Kenacort 0.1%)',
        dosage: 'Pea-sized dab',
        frequency: 'Thrice daily application after food',
        duration: '14 days',
        instructions: 'Apply gently over the cheek lesion with a clean finger. Do not eat/drink for 30 minutes.'
      },
      {
        name: 'Chlorhexidine Gluconate Mouthwash 0.2%',
        dosage: '10 ml undiluted',
        frequency: 'Twice daily',
        duration: '14 days',
        instructions: 'Swish for 60 seconds and spit out.'
      }
    ],
    biopsyRecommended: true,
    biopsyProcedureDetails: 'Diagnostic 4mm punch biopsy of right buccal mucosa. Histopathology referral to GGH Paderu (Government General Hospital Paderu).',
    trackingStatus: 'Biopsy Scheduled',
    printableBarcodeId: 'BAR-ASR-2026-GM046',
    clinicalNotes: 'Biopsy order linked to UIDN-ASR-2026-GM046 with histopathology referral to GGH Paderu.'
  };
  await store.savePrescription(somannaPrescription);

  // Backward compatibility alias: Somanna with UIDN-ASR-2026-0001
  const somannaAlias = { ...somanna, uidn: 'UIDN-ASR-2026-0001' };
  await store.savePatient(somannaAlias);
  await store.saveScreening({ ...somannaScreening, screeningId: 'SCR-ASR-2026-0001', patientUidn: 'UIDN-ASR-2026-0001' });
  await store.saveAppointment({ ...somannaAppointment, appointmentId: 'APT-ASR-2026-0001', patientUidn: 'UIDN-ASR-2026-0001' });
  await store.savePrescription({ ...somannaPrescription, rxId: 'RX-ASR-2026-0001', patientUidn: 'UIDN-ASR-2026-0001' });

  // 4. SEED PATIENT 2: M. LAKSHMI
  const lakshmi = {
    uidn: 'UIDN-ASR-2026-0002',
    name: 'M. Lakshmi',
    dob: new Date('1994-08-25'),
    age: 32,
    gender: 'FEMALE',
    bloodGroup: 'B+',
    phone: '9490123452',
    aadhar: '7812-3456-7890',
    mandal: 'Araku Valley',
    village: 'Padmapuram',
    habitation: 'Araku Valley Colony',
    photoUrl: '/uploads/m_lakshmi_oral.jpg',
    consentTimestamp: new Date('2026-11-03T11:15:00Z')
  };
  await store.savePatient(lakshmi);
  await store.saveUser({
    phone: lakshmi.phone,
    aadhar: lakshmi.aadhar,
    role: 'patient',
    uidn: lakshmi.uidn,
    passwordHash: defaultPasswordHash,
    activeStatus: true
  });

  const lakshmiScreening = {
    screeningId: 'SCR-ASR-2026-0002',
    patientUidn: lakshmi.uidn,
    oralRegion: 'Left Cheek',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600',
    symptomsChecklist: [
      'Velvety erythematous red patch on left buccal mucosa',
      'Persistent burning pain with salt or spices'
    ],
    habitExposure: {
      tobacco: false,
      gutkha: false,
      reverseSmoking: false,
      areca: true,
      years: 7,
      frequency: '3-4 times daily betel quid'
    },
    aiCondition: 'Serious',
    aiConfidenceScore: 92.4,
    aiLesionType: 'Erythroplakia / Dysplastic Mucositis',
    boundingBoxCoordinates: {
      xmin: 200,
      ymin: 190,
      xmax: 490,
      ymax: 430
    },
    clinicalRemarks: 'High malignant potential erythroplakic area. Recommended specialist consultation with Dr. Swapna Devi / Dr. K. Rajesh.'
  };
  await store.saveScreening(lakshmiScreening);

  const lakshmiAppointment = {
    appointmentId: 'APT-ASR-2026-0002',
    patientUidn: lakshmi.uidn,
    doctorUidn: 'DOC-SWAPNA',
    mandal: 'Araku Valley',
    hospitalName: 'Community Health Centre Araku Valley',
    apptType: 'General Oral Consultation',
    appointmentDate: new Date('2026-11-16T11:30:00Z'),
    dayOfWeek: 'Monday',
    timeSlot: '11:30 AM - 12:00 PM',
    status: 'APPROVED',
    doctorRemarks: 'Vital staining and clinical mapping scheduled.'
  };
  await store.saveAppointment(lakshmiAppointment);

  const lakshmiPrescription = {
    rxId: 'RX-ASR-2026-0002',
    patientUidn: lakshmi.uidn,
    doctorUidn: 'DOC-SWAPNA',
    date: new Date('2026-11-04T10:00:00Z'),
    medicines: [
      {
        name: 'Beta-Carotene & Vitamin E Softgels',
        dosage: '1 capsule',
        frequency: 'Daily after lunch',
        duration: '30 days',
        instructions: 'Take with milk or water.'
      },
      {
        name: 'Mucoprotective Gel (Benzydamine Oral Rinse 0.15%)',
        dosage: '15 ml',
        frequency: 'Thrice daily before meals',
        duration: '10 days',
        instructions: 'Gargle gently to relieve mucosal burning.'
      }
    ],
    biopsyRecommended: false,
    trackingStatus: 'Prescription Dispensed',
    printableBarcodeId: 'BAR-ASR-2026-80825-LAKSHMI',
    clinicalNotes: 'Areca nut chew habit cessation advised. Follow-up after 14 days.'
  };
  await store.savePrescription(lakshmiPrescription);

  // 5. SEED PATIENT 3: P. RAMU
  const ramu = {
    uidn: 'UIDN-ASR-2026-0003',
    name: 'P. Ramu',
    dob: new Date('1968-01-10'),
    age: 58,
    gender: 'MALE',
    bloodGroup: 'A+',
    phone: '9490123453',
    aadhar: '8923-4567-8901',
    mandal: 'Paderu',
    village: 'Paderu Agency',
    habitation: 'Paderu Tribal Hamlet',
    photoUrl: '/uploads/p_ramu_oral.jpg',
    consentTimestamp: new Date('2026-11-05T14:20:00Z')
  };
  await store.savePatient(ramu);
  await store.saveUser({
    phone: ramu.phone,
    aadhar: ramu.aadhar,
    role: 'patient',
    uidn: ramu.uidn,
    passwordHash: defaultPasswordHash,
    activeStatus: true
  });

  const ramuScreening = {
    screeningId: 'SCR-ASR-2026-0003',
    patientUidn: ramu.uidn,
    oralRegion: 'Right Buccal Mucosa',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
    symptomsChecklist: [
      'Severe restricted mouth opening (< 20mm inter-incisal distance)',
      'Fibrous vertical bands palpable in bilateral buccal mucosa',
      'Blanched marble-like mucosal appearance'
    ],
    habitExposure: {
      tobacco: true,
      gutkha: true,
      reverseSmoking: false,
      areca: true,
      years: 22,
      frequency: '8-10 packets commercially packaged gutkha daily'
    },
    aiCondition: 'Serious',
    aiConfidenceScore: 93.4,
    aiLesionType: 'Oral Submucous Fibrosis (OSMF) Grade III',
    boundingBoxCoordinates: {
      xmin: 210,
      ymin: 150,
      xmax: 520,
      ymax: 460
    },
    clinicalRemarks: 'Advanced stage OSMF with severe trismus. Commenced intralesional corticosteroid protocol and physiotherapy.'
  };
  await store.saveScreening(ramuScreening);

  const ramuAppointment = {
    appointmentId: 'APT-ASR-2026-0003',
    patientUidn: ramu.uidn,
    doctorUidn: 'DOC-RAJESH',
    mandal: 'Paderu',
    hospitalName: 'Area Hospital Paderu (AH Paderu / District Hub)',
    apptType: 'General Oral Consultation',
    appointmentDate: new Date('2026-11-18T10:30:00Z'),
    dayOfWeek: 'Wednesday',
    timeSlot: '10:30 AM - 11:00 AM',
    status: 'PENDING',
    doctorRemarks: 'Awaiting intralesional injection round 2 with Dr. Rajesh.'
  };
  await store.saveAppointment(ramuAppointment);

  const ramuPrescription = {
    rxId: 'RX-ASR-2026-0003',
    patientUidn: ramu.uidn,
    doctorUidn: 'DOC-RAJESH',
    date: new Date('2026-11-06T15:30:00Z'),
    medicines: [
      {
        name: 'Hyaluronidase + Dexamethasone Intralesional Vial',
        dosage: '1500 IU + 4mg',
        frequency: 'Bi-weekly submucosal injection by MO',
        duration: '6 weeks',
        instructions: 'Administered under clinical supervision only.'
      },
      {
        name: 'Pentoxifylline Extended-Release 400mg',
        dosage: '1 tablet',
        frequency: 'Thrice daily with meals',
        duration: '60 days',
        instructions: 'Improves microvascular circulation to fibrotic tissue.'
      },
      {
        name: 'Curcumin 500mg Lozenges',
        dosage: '1 lozenge',
        frequency: 'Dissolve in mouth 4 times daily',
        duration: '30 days',
        instructions: 'Natural anti-inflammatory.'
      }
    ],
    biopsyRecommended: false,
    trackingStatus: 'Prescription Dispensed',
    printableBarcodeId: 'BAR-ASR-2026-70110-RAMU',
    clinicalNotes: 'Mouth opening exercises with wooden spatulas recommended 5 times daily.'
  };
  await store.savePrescription(ramuPrescription);

  // 6. SEED SYSTEM ADMIN & HOSPITAL MANAGER USERS
  await store.saveUser({
    email: 'admin@aarogyadrishti.org',
    phone: '9848099999',
    role: 'admin',
    passwordHash: defaultPasswordHash,
    activeStatus: true
  });

  await store.saveUser({
    email: 'manager.paderu@aarogyadrishti.org',
    phone: '9848088888',
    role: 'hospital_manager',
    passwordHash: defaultPasswordHash,
    activeStatus: true
  });

  // Seed initial audit log
  await store.logAction({
    actorId: 'SYSTEM_BOOTSTRAP',
    role: 'admin',
    action: 'SEED_INITIAL_DATASET_LOADED',
    details: {
      mandalsCovered: 11,
      hospitalsSeeded: hospitals.length,
      doctorsSeeded: doctors.length,
      patientsSeeded: 3
    }
  });

  console.log('✅ [Seed] Enterprise seed data successfully mounted into resilient storage!');
};

export default seedDatabase;

