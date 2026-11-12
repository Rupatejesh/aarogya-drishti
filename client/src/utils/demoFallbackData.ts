import type { PatientRecord, ReferralRecord } from '../services/api'

export const DEMO_KILLO_SOMANNA_PATIENT: PatientRecord = {
  _id: '673000000000000000000001',
  patientId: 'PT-20261110-GMAD01',
  maaUidn: 'UIDN-ASR-GMAD-2026-0842',
  fullName: 'Killo Somanna',
  age: 46,
  sex: 'MALE',
  phone: '9876543210',
  address: {
    village: 'G. Madugula',
    mandal: 'G. Madugula',
    phcId: 'PHC-GMADUGULA',
    district: 'Alluri Sitharama Raju',
  },
  exposureHistory: {
    tobaccoUse: 'CURRENT',
  },
  registrationStatus: 'ACTIVE',
}

export const DEMO_KILLO_SOMANNA_REFERRAL: ReferralRecord = {
  _id: '673000000000000000000002',
  screening: '673000000000000000000003',
  patient: {
    _id: '673000000000000000000001',
    patientId: 'PT-20261110-GMAD01',
    fullName: 'Killo Somanna',
    age: 46,
    sex: 'MALE',
    address: {
      village: 'G. Madugula',
      mandal: 'G. Madugula',
      phcId: 'PHC-GMADUGULA',
    },
    exposureHistory: {
      tobaccoUse: 'CURRENT',
    },
  },
  assignedSpecialist: {
    _id: '673000000000000000000004',
    fullName: 'Dr. V. Anitha Rao (Oral Oncologist, DH Paderu)',
    role: 'SPECIALIST',
  },
  referralReason:
    'Persistent non-scrapable white patch (Leukoplakia / OPMD) on right buccal mucosa > 6 weeks with 15-year chewing tobacco/gutkha habit; urgent specialist evaluation and incisional biopsy required.',
  priority: 'URGENT',
  referredTo: 'Dr. V. Anitha Rao (Oral Oncologist, District Hospital Paderu)',
  facilityName: 'District Hospital Paderu',
  appointmentDate: '2026-11-11T10:30:00.000Z',
  status: 'CONFIRMED',
  notes: 'ITDA Paderu tribal health desk notified for transport assistance.',
}

