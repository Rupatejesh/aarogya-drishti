import React, { useState } from 'react'
import {
  ASR_DISTRICT_FACILITIES,
  getAsrFacilitiesSummary,
  type AsrPhcFacility,
} from '../data/asrPhcDirectory'

export interface HospitalItem {
  id: string
  name: string
  mandal: string
  type: 'DISTRICT_HOSPITAL' | 'AREA_HOSPITAL' | 'CHC' | 'PHC' | 'GGH' | 'SUBCENTRE'
  bedCapacity: number
  activeBedsAvailable?: number
  activeAmbulancesAvailable?: number
  activeDoctors: number
  contactPhone: string
  status: 'ACTIVE' | 'MAINTENANCE'
}

export interface DoctorItem {
  id: string
  fullName: string
  specialization: string
  hospitalId: string
  hospitalName: string
  mandal: string
  apmcRegNumber: string
  dutyStatus: 'ON_DUTY' | 'OFF_DUTY'
  email: string
  phone: string
  degrees?: string[]
  almaMater?: string
  experienceYears?: number
  practiceType?: 'GOVERNMENT' | 'PRIVATE_VISITING'
  activeCaseload?: number
  privateClinicAffiliation?: string
  consultationFee?: number
}

export interface MandalGisData {
  name: string
  teluguName: string
  phcCount: number
  screenedTotal: number
  highRiskOpmd: number
  biopsiesReferred: number
  activeAshaWorkers: number
  riskTier: 'HIGH' | 'MODERATE' | 'LOW'
  activeBedsAvailable: number
  totalBedCapacity: number
  activeAmbulancesAvailable: number
  deployedSpecialistDensity: number
  altitude: string
  mapColor: string
}

function speakBujjiTeluguVoice(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'te-IN'
    utterance.rate = 0.95
    utterance.pitch = 1.15
    window.speechSynthesis.speak(utterance)
  } catch {}
}

const INITIAL_MANDALS: MandalGisData[] = [
  {
    name: 'Paderu',
    teluguName: 'పాడేరు',
    phcCount: 8,
    screenedTotal: 1420,
    highRiskOpmd: 84,
    biopsiesReferred: 28,
    activeAshaWorkers: 42,
    riskTier: 'HIGH',
    activeBedsAvailable: 48,
    totalBedCapacity: 120,
    activeAmbulancesAvailable: 6,
    deployedSpecialistDensity: 4.8,
    altitude: '910m (Agency Capital Hub)',
    mapColor: '#3b82f6',
  },
  {
    name: 'G. Madugula',
    teluguName: 'జి. మాడుగుల',
    phcCount: 4,
    screenedTotal: 1180,
    highRiskOpmd: 72,
    biopsiesReferred: 24,
    activeAshaWorkers: 36,
    riskTier: 'HIGH',
    activeBedsAvailable: 14,
    totalBedCapacity: 30,
    activeAmbulancesAvailable: 3,
    deployedSpecialistDensity: 2.1,
    altitude: '1,020m (Hill Valley Basin)',
    mapColor: '#e11d48',
  },
  {
    name: 'Chintapalli',
    teluguName: 'చింతపల్లి',
    phcCount: 6,
    screenedTotal: 980,
    highRiskOpmd: 48,
    biopsiesReferred: 16,
    activeAshaWorkers: 30,
    riskTier: 'HIGH',
    activeBedsAvailable: 28,
    totalBedCapacity: 60,
    activeAmbulancesAvailable: 4,
    deployedSpecialistDensity: 3.2,
    altitude: '1,100m (Kashmir of Andhra Pradesh)',
    mapColor: '#8b5cf6',
  },
  {
    name: 'Araku Valley',
    teluguName: 'అరకు లోయ',
    phcCount: 5,
    screenedTotal: 890,
    highRiskOpmd: 39,
    biopsiesReferred: 12,
    activeAshaWorkers: 28,
    riskTier: 'MODERATE',
    activeBedsAvailable: 22,
    totalBedCapacity: 50,
    activeAmbulancesAvailable: 4,
    deployedSpecialistDensity: 2.9,
    altitude: '950m (Valley of Coffee & Waterfalls)',
    mapColor: '#059669',
  },
  {
    name: 'Hukumpeta',
    teluguName: 'హుకుంపేట',
    phcCount: 3,
    screenedTotal: 640,
    highRiskOpmd: 28,
    biopsiesReferred: 9,
    activeAshaWorkers: 20,
    riskTier: 'MODERATE',
    activeBedsAvailable: 12,
    totalBedCapacity: 24,
    activeAmbulancesAvailable: 2,
    deployedSpecialistDensity: 1.8,
    altitude: '880m (Forest Canopy Watershed)',
    mapColor: '#d97706',
  },
  {
    name: 'Ananthagiri',
    teluguName: 'అనంతగిరి',
    phcCount: 4,
    screenedTotal: 520,
    highRiskOpmd: 22,
    biopsiesReferred: 7,
    activeAshaWorkers: 18,
    riskTier: 'LOW',
    activeBedsAvailable: 10,
    totalBedCapacity: 20,
    activeAmbulancesAvailable: 2,
    deployedSpecialistDensity: 1.6,
    altitude: '1,050m (Karst Limestone Gorges)',
    mapColor: '#0284c7',
  },
  {
    name: 'Dumbriguda',
    teluguName: 'డుంబ్రిగుడ',
    phcCount: 3,
    screenedTotal: 490,
    highRiskOpmd: 19,
    biopsiesReferred: 6,
    activeAshaWorkers: 16,
    riskTier: 'LOW',
    activeBedsAvailable: 11,
    totalBedCapacity: 20,
    activeAmbulancesAvailable: 2,
    deployedSpecialistDensity: 1.7,
    altitude: '920m (Granite Waterfall Corridors)',
    mapColor: '#10b981',
  },
  {
    name: 'Munchingiputtu',
    teluguName: 'ముంచంగిపుట్టు',
    phcCount: 4,
    screenedTotal: 580,
    highRiskOpmd: 31,
    biopsiesReferred: 11,
    activeAshaWorkers: 22,
    riskTier: 'MODERATE',
    activeBedsAvailable: 15,
    totalBedCapacity: 30,
    activeAmbulancesAvailable: 3,
    deployedSpecialistDensity: 1.9,
    altitude: '860m (Jalaput Reservoir Plateau)',
    mapColor: '#6366f1',
  },
  {
    name: 'Pedabayalu',
    teluguName: 'పెద్దబయలు',
    phcCount: 4,
    screenedTotal: 610,
    highRiskOpmd: 25,
    biopsiesReferred: 8,
    activeAshaWorkers: 24,
    riskTier: 'LOW',
    activeBedsAvailable: 12,
    totalBedCapacity: 24,
    activeAmbulancesAvailable: 2,
    deployedSpecialistDensity: 1.8,
    altitude: '890m (Terraced Paddy Plateaus)',
    mapColor: '#14b8a6',
  },
  {
    name: 'Koyyuru',
    teluguName: 'కొయ్యూరు',
    phcCount: 5,
    screenedTotal: 730,
    highRiskOpmd: 41,
    biopsiesReferred: 14,
    activeAshaWorkers: 26,
    riskTier: 'MODERATE',
    activeBedsAvailable: 16,
    totalBedCapacity: 30,
    activeAmbulancesAvailable: 3,
    deployedSpecialistDensity: 2.0,
    altitude: '650m (Southern Deciduous Agency Foothills)',
    mapColor: '#f97316',
  },
  {
    name: 'G.K. Veedhi',
    teluguName: 'గూడెం కొత్త వీధి',
    phcCount: 5,
    screenedTotal: 690,
    highRiskOpmd: 37,
    biopsiesReferred: 13,
    activeAshaWorkers: 25,
    riskTier: 'MODERATE',
    activeBedsAvailable: 14,
    totalBedCapacity: 28,
    activeAmbulancesAvailable: 3,
    deployedSpecialistDensity: 1.9,
    altitude: '780m (Dense High-Biodiversity Rain Corridors)',
    mapColor: '#ec4899',
  },
]

export const ITDA_MANDAL_SURVEILLANCE_ROWS = [
  {
    mandal: 'Paderu',
    phcHub: 'District Hospital Paderu / PHC Paderu',
    screenings: 312,
    suspiciousAiDetections: 24,
    confirmedReferrals: 14,
    biopsyPipeline: 7,
    transportMissions: 5,
  },
  {
    mandal: 'G. Madugula',
    phcHub: 'PHC G. Madugula (Killo Somanna Hub)',
    screenings: 248,
    suspiciousAiDetections: 19,
    confirmedReferrals: 11,
    biopsyPipeline: 6,
    transportMissions: 5,
  },
  {
    mandal: 'Chintapalli',
    phcHub: 'CHC Chintapalli & YTC Campus Hub',
    screenings: 215,
    suspiciousAiDetections: 16,
    confirmedReferrals: 8,
    biopsyPipeline: 5,
    transportMissions: 3, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Araku Valley',
    phcHub: 'Area Hospital Araku Valley',
    screenings: 184,
    suspiciousAiDetections: 13,
    confirmedReferrals: 6,
    biopsyPipeline: 3, // N < 5 -> k-anonymity suppressed!
    transportMissions: 2, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Koyyuru',
    phcHub: 'PHC Koyyuru',
    screenings: 132,
    suspiciousAiDetections: 9,
    confirmedReferrals: 5,
    biopsyPipeline: 2, // N < 5 -> k-anonymity suppressed!
    transportMissions: 2, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Peddabayalu',
    phcHub: 'PHC Peddabayalu',
    screenings: 104,
    suspiciousAiDetections: 7,
    confirmedReferrals: 4, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 2, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Hukumpeta',
    phcHub: 'PHC Hukumpeta',
    screenings: 89,
    suspiciousAiDetections: 6,
    confirmedReferrals: 3, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Dumbriguda',
    phcHub: 'PHC Dumbriguda',
    screenings: 76,
    suspiciousAiDetections: 5,
    confirmedReferrals: 3, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Ananthagiri',
    phcHub: 'PHC Ananthagiri',
    screenings: 68,
    suspiciousAiDetections: 4, // N < 5 -> k-anonymity suppressed!
    confirmedReferrals: 2, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Munchingi Puttu',
    phcHub: 'PHC Munchingi Puttu',
    screenings: 58,
    suspiciousAiDetections: 4, // N < 5 -> k-anonymity suppressed!
    confirmedReferrals: 2, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'G.K. Veedhi (Gudem Kotha Veedhi)',
    phcHub: 'CHC G.K. Veedhi Tribal Facility',
    screenings: 62,
    suspiciousAiDetections: 4, // N < 5 -> k-anonymity suppressed!
    confirmedReferrals: 2, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
]

export function formatKAnonymityCell(count: number): string {
  if (count < 5) {
    return 'Suppressed (N < 5 · k-Anonymity)'
  }
  return count.toLocaleString('en-IN')
}

export const AdminDashboard: React.FC = () => {
  // Hospitals State
  const [hospitals, setHospitals] = useState<HospitalItem[]>([
    {
      id: 'HOSP-ASR-00',
      name: 'Government General Hospital (GGH) Paderu',
      mandal: 'Paderu',
      type: 'GGH',
      bedCapacity: 250,
      activeBedsAvailable: 85,
      activeAmbulancesAvailable: 6,
      activeDoctors: 24,
      contactPhone: '+91 8935 241100',
      status: 'ACTIVE',
    },
    {
      id: 'HOSP-ASR-01',
      name: 'District Hospital Paderu',
      mandal: 'Paderu',
      type: 'DISTRICT_HOSPITAL',
      bedCapacity: 150,
      activeBedsAvailable: 48,
      activeAmbulancesAvailable: 5,
      activeDoctors: 12,
      contactPhone: '+91 8935 241022',
      status: 'ACTIVE',
    },
    {
      id: 'HOSP-ASR-02',
      name: 'Area Hospital Araku Valley',
      mandal: 'Araku Valley',
      type: 'AREA_HOSPITAL',
      bedCapacity: 100,
      activeBedsAvailable: 32,
      activeAmbulancesAvailable: 4,
      activeDoctors: 8,
      contactPhone: '+91 8936 249015',
      status: 'ACTIVE',
    },
    {
      id: 'HOSP-ASR-03',
      name: 'Community Health Center Chintapalli',
      mandal: 'Chintapalli',
      type: 'CHC',
      bedCapacity: 50,
      activeBedsAvailable: 18,
      activeAmbulancesAvailable: 3,
      activeDoctors: 5,
      contactPhone: '+91 8937 252110',
      status: 'ACTIVE',
    },
    {
      id: 'HOSP-ASR-04',
      name: 'Primary Health Center G. Madugula',
      mandal: 'G. Madugula',
      type: 'PHC',
      bedCapacity: 30,
      activeBedsAvailable: 14,
      activeAmbulancesAvailable: 2,
      activeDoctors: 3,
      contactPhone: '+91 8938 238044',
      status: 'ACTIVE',
    },
    {
      id: 'HOSP-ASR-05',
      name: 'Sub-Centre & Anganwadi Clinic Vantala',
      mandal: 'G. Madugula',
      type: 'SUBCENTRE',
      bedCapacity: 6,
      activeBedsAvailable: 4,
      activeAmbulancesAvailable: 1,
      activeDoctors: 1,
      contactPhone: '+91 8938 238099',
      status: 'ACTIVE',
    },
  ])

  // Doctors Roster State
  const [doctors, setDoctors] = useState<DoctorItem[]>([
    {
      id: 'DOC-01',
      fullName: 'Dr. V. Anitha Rao, MDS',
      specialization: 'Oral Oncology & Maxillofacial Specialist',
      hospitalId: 'HOSP-ASR-01',
      hospitalName: 'District Hospital Paderu',
      mandal: 'Paderu',
      apmcRegNumber: 'APMC-78421-MDS',
      degrees: ['BDS', 'MDS (Oral Oncology)'],
      almaMater: 'Andhra Medical College / GDC Hyderabad',
      experienceYears: 14,
      practiceType: 'GOVERNMENT',
      activeCaseload: 18,
      consultationFee: 0,
      dutyStatus: 'ON_DUTY',
      email: 'anitha.rao@asr.health.gov.in',
      phone: '+91 94401 23456',
    },
    {
      id: 'DOC-02',
      fullName: 'Dr. K. Rajesh Varma, MD',
      specialization: 'General Medicine & Telemedicine Clinician',
      hospitalId: 'HOSP-ASR-02',
      hospitalName: 'Area Hospital Araku Valley',
      mandal: 'Araku Valley',
      apmcRegNumber: 'APMC-61902-MD',
      degrees: ['MBBS', 'MD (General Medicine)'],
      almaMater: 'Rangaraya Medical College Kakinada',
      experienceYears: 11,
      practiceType: 'GOVERNMENT',
      activeCaseload: 24,
      consultationFee: 0,
      dutyStatus: 'ON_DUTY',
      email: 'rajesh.varma@asr.health.gov.in',
      phone: '+91 94402 34567',
    },
    {
      id: 'DOC-03',
      fullName: 'Dr. S. Lavanya, BDS',
      specialization: 'Oral Pathology & Preventive Dentistry',
      hospitalId: 'HOSP-ASR-03',
      hospitalName: 'CHC Chintapalli',
      mandal: 'Chintapalli',
      apmcRegNumber: 'APMC-89301-BDS',
      degrees: ['BDS (Oral Pathology)'],
      almaMater: 'Govt Dental College Vijayawada',
      experienceYears: 7,
      practiceType: 'PRIVATE_VISITING',
      activeCaseload: 12,
      privateClinicAffiliation: 'Lavanya Oral Care Poly-Clinic, Chintapalli',
      consultationFee: 250,
      dutyStatus: 'OFF_DUTY',
      email: 'lavanya.s@asr.health.gov.in',
      phone: '+91 94403 45678',
    },
    {
      id: 'DOC-04',
      fullName: 'Dr. M. Suresh Kumar, MBBS',
      specialization: 'Primary Medical Officer & Rural Field Lead',
      hospitalId: 'HOSP-ASR-04',
      hospitalName: 'PHC G. Madugula',
      mandal: 'G. Madugula',
      apmcRegNumber: 'APMC-55120-MBBS',
      degrees: ['MBBS (Community Medicine)'],
      almaMater: 'Andhra Medical College Visakhapatnam',
      experienceYears: 9,
      practiceType: 'GOVERNMENT',
      activeCaseload: 15,
      consultationFee: 0,
      dutyStatus: 'ON_DUTY',
      email: 'suresh.kumar@asr.health.gov.in',
      phone: '+91 94404 56789',
    },
  ])

  // GIS Selection State
  const [selectedMandal, setSelectedMandal] = useState<MandalGisData>(INITIAL_MANDALS[1]) // Default G. Madugula
  const [showMandalModal, setShowMandalModal] = useState(false)
  const [hoveredMandalName, setHoveredMandalName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'GIS' | 'HOSPITALS' | 'ROSTER' | 'ABDM_REGISTRY'>('ABDM_REGISTRY')
  const [notice, setNotice] = useState<string>('')
  const [phcSearchQuery, setPhcSearchQuery] = useState('')
  const [phcMandalFilter, setPhcMandalFilter] = useState('ALL')
  const [phcTypeFilter, setPhcTypeFilter] = useState('ALL')
  const asrSummary = getAsrFacilitiesSummary()

  // Modal State
  const [activeModal, setActiveModal] = useState<
    'ADD_HOSPITAL' | 'EDIT_HOSPITAL' | 'ADD_DOCTOR' | 'EDIT_DOCTOR' | null
  >(null)
  const [editingHospital, setEditingHospital] = useState<HospitalItem | null>(null)
  const [editingDoctor, setEditingDoctor] = useState<DoctorItem | null>(null)

  // Hospital Form Fields
  const [hospName, setHospName] = useState('')
  const [hospMandal, setHospMandal] = useState('Paderu')
  const [hospType, setHospType] = useState<HospitalItem['type']>('PHC')
  const [hospBeds, setHospBeds] = useState(30)
  const [hospPhone, setHospPhone] = useState('')

  // Doctor Form Fields
  const [docName, setDocName] = useState('')
  const [docSpec, setDocSpec] = useState('Oral Oncology & Maxillofacial Specialist')
  const [docHospId, setDocHospId] = useState('HOSP-ASR-01')
  const [docApmc, setDocApmc] = useState('')
  const [docPhone, setDocPhone] = useState('')
  const [docEmail, setDocEmail] = useState('')

  // Dynamic Toggle Duty Status with 3 states (ON_DUTY, CIRCUIT_VISIT, OFF_DUTY)
  const handleToggleDutyStatus = (doctorId: string) => {
    setDoctors((prev) =>
      prev.map((doc) => {
        if (doc.id === doctorId) {
          const nextStatus: 'ON_DUTY' | 'OFF_DUTY' = doc.dutyStatus === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY'
          setNotice(`✓ Updated ${doc.fullName} duty status to ${nextStatus === 'ON_DUTY' ? '🟢 ON DUTY · TELEMEDICINE' : '🔴 OFF DUTY / ON CALL'}.`)
          speakBujjiTeluguVoice(`${doc.fullName} గారి డ్యూటీ స్థితి నవీకరించబడింది: ${nextStatus === 'ON_DUTY' ? 'ఆన్ డ్యూటీ' : 'ఆఫ్ డ్యూటీ'}`)
          setTimeout(() => setNotice(''), 3500)
          return { ...doc, dutyStatus: nextStatus }
        }
        return doc
      }),
    )
  }

  // Open Edit Hospital Modal
  const openEditHospital = (hosp: HospitalItem) => {
    setEditingHospital(hosp)
    setHospName(hosp.name)
    setHospMandal(hosp.mandal)
    setHospType(hosp.type)
    setHospBeds(hosp.bedCapacity)
    setHospPhone(hosp.contactPhone)
    setActiveModal('EDIT_HOSPITAL')
  }

  // Open Edit Doctor Modal
  const openEditDoctor = (doc: DoctorItem) => {
    setEditingDoctor(doc)
    setDocName(doc.fullName)
    setDocSpec(doc.specialization)
    setDocHospId(doc.hospitalId)
    setDocApmc(doc.apmcRegNumber)
    setDocPhone(doc.phone)
    setDocEmail(doc.email)
    setActiveModal('EDIT_DOCTOR')
  }

  // Save Hospital (Add or Edit)
  const handleSaveHospital = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospName.trim()) return

    if (activeModal === 'ADD_HOSPITAL') {
      const newHosp: HospitalItem = {
        id: `HOSP-ASR-${Date.now().toString().slice(-4)}`,
        name: hospName.trim(),
        mandal: hospMandal,
        type: hospType,
        bedCapacity: Number(hospBeds) || 20,
        activeDoctors: 1,
        contactPhone: hospPhone || '+91 8935 200000',
        status: 'ACTIVE',
      }
      setHospitals((prev) => [...prev, newHosp])
      setNotice(`✓ Successfully registered hospital: ${newHosp.name}`)
    } else if (activeModal === 'EDIT_HOSPITAL' && editingHospital) {
      setHospitals((prev) =>
        prev.map((h) =>
          h.id === editingHospital.id
            ? {
                ...h,
                name: hospName.trim(),
                mandal: hospMandal,
                type: hospType,
                bedCapacity: Number(hospBeds),
                contactPhone: hospPhone,
              }
            : h,
        ),
      )
      setNotice(`✓ Updated hospital profile: ${hospName}`)
    }

    setActiveModal(null)
    setEditingHospital(null)
    setTimeout(() => setNotice(''), 3500)
  }

  // Save Doctor (Add or Edit)
  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!docName.trim()) return

    const matchedHosp = hospitals.find((h) => h.id === docHospId) || hospitals[0]

    if (activeModal === 'ADD_DOCTOR') {
      const newDoc: DoctorItem = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        fullName: docName.trim(),
        specialization: docSpec,
        hospitalId: matchedHosp.id,
        hospitalName: matchedHosp.name,
        mandal: matchedHosp.mandal,
        apmcRegNumber: docApmc || `APMC-${Math.floor(10000 + Math.random() * 90000)}`,
        dutyStatus: 'ON_DUTY',
        email: docEmail || `${docName.toLowerCase().replace(/[^a-z]/g, '')}@asr.health.gov.in`,
        phone: docPhone || '+91 94400 00000',
      }
      setDoctors((prev) => [newDoc, ...prev])
      setNotice(`✓ Successfully added ${newDoc.fullName} to ${matchedHosp.name} roster.`)
    } else if (activeModal === 'EDIT_DOCTOR' && editingDoctor) {
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === editingDoctor.id
            ? {
                ...d,
                fullName: docName.trim(),
                specialization: docSpec,
                hospitalId: matchedHosp.id,
                hospitalName: matchedHosp.name,
                mandal: matchedHosp.mandal,
                apmcRegNumber: docApmc,
                email: docEmail,
                phone: docPhone,
              }
            : d,
        ),
      )
      setNotice(`✓ Updated credentials for ${docName}`)
    }

    setActiveModal(null)
    setEditingDoctor(null)
    setTimeout(() => setNotice(''), 3500)
  }

  // Aggregate division totals
  const totalScreened = INITIAL_MANDALS.reduce((acc, m) => acc + m.screenedTotal, 0)
  const totalHighRisk = INITIAL_MANDALS.reduce((acc, m) => acc + m.highRiskOpmd, 0)

  const allMandalsList = Array.from(new Set(ASR_DISTRICT_FACILITIES.map((f) => f.mandal))).sort()

  const filteredFacilities: AsrPhcFacility[] = ASR_DISTRICT_FACILITIES.filter((fac) => {
    if (phcMandalFilter !== 'ALL' && fac.mandal.toLowerCase() !== phcMandalFilter.toLowerCase()) {
      return false
    }
    if (phcTypeFilter !== 'ALL' && fac.type !== phcTypeFilter) {
      return false
    }
    if (phcSearchQuery.trim()) {
      const q = phcSearchQuery.trim().toLowerCase()
      const matchName = fac.facilityName.toLowerCase().includes(q)
      const matchCode = fac.facilityCode.toLowerCase().includes(q)
      const matchDoc = fac.medicalOfficerName.toLowerCase().includes(q)
      const matchHpr = fac.hprId.toLowerCase().includes(q)
      const matchMandal = fac.mandal.toLowerCase().includes(q)
      return matchName || matchCode || matchDoc || matchHpr || matchMandal
    }
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🏛️</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              Government of Andhra Pradesh · ITDA Paderu
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
            Aarogya Drishti Platform Administration &amp; GIS Command Center
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
            Alluri Sitharama Raju (ASR) District · 11 Tribal Mandals Healthcare Infrastructure &amp; Surveillance
          </p>
        </div>

        {/* Division Metric Counters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.6rem 0.9rem', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{totalScreened.toLocaleString()}</div>
            <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Total Screened</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.6rem 0.9rem', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{totalHighRisk}</div>
            <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>High-Risk OPMD</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.6rem 0.9rem', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{asrSummary.totalFacilities}</div>
            <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>ABDM Facilities ({asrSummary.phcsCount} PHCs + {asrSummary.hospitalsCount} Apex)</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.6rem 0.9rem', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{asrSummary.verifiedDoctorsCount}</div>
            <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Verified MOs (100% HPR ID)</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.6rem 0.9rem', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>{asrSummary.totalBeds} ({asrSummary.vacantBeds} Vacant)</div>
            <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Active Beds ({asrSummary.occupancyRate}% Occ)</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.6rem 0.9rem', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fb923c' }}>{asrSummary.totalAmbulances}</div>
            <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>108 &amp; 4x4 Ambulances</div>
          </div>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            background: '#ecfdf5',
            border: '1.5px solid #10b981',
            color: '#065f46',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          {notice}
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('GIS')}
          style={{
            background: activeTab === 'GIS' ? '#1e3a8a' : 'transparent',
            color: activeTab === 'GIS' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          🗺️ 11-Mandal GIS Clinical Surveillance Grid
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ABDM_REGISTRY')}
          style={{
            background: activeTab === 'ABDM_REGISTRY' ? '#1e3a8a' : 'transparent',
            color: activeTab === 'ABDM_REGISTRY' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          📋 ASR PHC Doctors &amp; ABDM Registry ({ASR_DISTRICT_FACILITIES.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HOSPITALS')}
          style={{
            background: activeTab === 'HOSPITALS' ? '#1e3a8a' : 'transparent',
            color: activeTab === 'HOSPITALS' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          🏥 Hospital &amp; Facility Network ({hospitals.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROSTER')}
          style={{
            background: activeTab === 'ROSTER' ? '#1e3a8a' : 'transparent',
            color: activeTab === 'ROSTER' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          🩺 Specialist &amp; Doctor Roster ({doctors.length})
        </button>
      </div>

      {/* TAB 1: 11-MANDAL GIS CLINICAL SURVEILLANCE GRID */}
      {activeTab === 'GIS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  Interactive 11-Mandal GIS Clinical Surveillance Grid
                </h3>
                <small style={{ color: '#64748b' }}>
                  Click any tribal mandal card to isolate epidemiology rates, screening volume, and ASHA field deployment.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px' }}>● High Risk</span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px' }}>● Moderate Risk</span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px' }}>● Low Risk</span>
              </div>
            </div>

            {/* 11 Mandals Grid with Real-Time Figma Micro-Animations */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.95rem' }}>
              {INITIAL_MANDALS.map((mandal) => {
                const isSelected = selectedMandal.name === mandal.name
                const isHovered = hoveredMandalName === mandal.name
                const riskColor =
                  mandal.riskTier === 'HIGH' ? '#dc2626' : mandal.riskTier === 'MODERATE' ? '#d97706' : '#16a34a'
                const riskBg =
                  mandal.riskTier === 'HIGH' ? '#fef2f2' : mandal.riskTier === 'MODERATE' ? '#fffbeb' : '#f0fdf4'

                return (
                  <div
                    key={mandal.name}
                    onMouseEnter={() => setHoveredMandalName(mandal.name)}
                    onMouseLeave={() => setHoveredMandalName(null)}
                    onClick={() => {
                      setSelectedMandal(mandal)
                      setShowMandalModal(true)
                      speakBujjiTeluguVoice(
                        `${mandal.name} మండలం ఆరోగ్య పర్యవేక్షణ. ఖాళీ బెడ్స్: ${mandal.activeBedsAvailable}. 108 అంబులెన్సులు: ${mandal.activeAmbulancesAvailable}. స్క్రీనింగ్ మొత్తం: ${mandal.screenedTotal} మంది.`
                      )
                    }}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
                        : isHovered
                          ? '#ffffff'
                          : riskBg,
                      color: isSelected ? '#ffffff' : '#0f172a',
                      border: isSelected
                        ? '2.5px solid #60a5fa'
                        : isHovered
                          ? `2px solid ${riskColor}`
                          : `1.5px solid ${riskColor}40`,
                      borderRadius: '14px',
                      padding: '1.1rem',
                      cursor: 'pointer',
                      transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      boxShadow: isSelected || isHovered
                        ? '0 16px 30px -8px rgba(30, 58, 138, 0.28), 0 0 0 1px rgba(96, 165, 250, 0.3)'
                        : '0 2px 4px rgba(0,0,0,0.03)',
                      transform: isSelected || isHovered ? 'translateY(-6px) scale(1.02)' : 'none',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', display: 'block' }}>{mandal.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: isSelected ? '#93c5fd' : '#64748b' }}>
                          {mandal.teluguName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: isSelected ? 'rgba(255,255,255,0.22)' : `${riskColor}20`,
                          color: isSelected ? '#ffffff' : riskColor,
                        }}
                      >
                        {mandal.riskTier}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      <div>
                        <span style={{ color: isSelected ? '#bfdbfe' : '#64748b' }}>Screened:</span>
                        <strong style={{ display: 'block', fontSize: '0.92rem' }}>{mandal.screenedTotal}</strong>
                      </div>
                      <div>
                        <span style={{ color: isSelected ? '#fca5a5' : '#dc2626' }}>OPMD High-Risk:</span>
                        <strong style={{ display: 'block', fontSize: '0.92rem', color: isSelected ? '#fecaca' : '#dc2626' }}>
                          {mandal.highRiskOpmd}
                        </strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: isSelected ? '#e2e8f0' : '#64748b', marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🏥 {mandal.phcCount} PHCs</span>
                      <span>👩‍⚕️ {mandal.activeAshaWorkers} ASHAs</span>
                    </div>

                    <div
                      style={{
                        marginTop: '0.6rem',
                        paddingTop: '0.45rem',
                        borderTop: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
                        fontSize: '0.72rem',
                        color: isSelected ? '#cbd5e1' : '#b45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>🛏️ {mandal.activeBedsAvailable} Beds · 🚑 {mandal.activeAmbulancesAvailable} Amb</span>
                      <span style={{ fontWeight: 800 }}>✦ Open ➔</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Drill-Down Inspector with Mandal Cultural & Agricultural Profile */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #d97706',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: '0 8px 24px -4px rgba(217, 119, 6, 0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Mandal Clinical &amp; Cultural Dossier
                </span>
                <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  📍 {selectedMandal.name} ({selectedMandal.teluguName}) · ITDA Paderu Sector
                </h4>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  ⛰️ Elevation: <strong>{selectedMandal.altitude}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="workflow-button"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
                  onClick={() => setShowMandalModal(true)}
                >
                  🗺️ Open Interactive Figma Showcase
                </button>
                <button
                  type="button"
                  className="workflow-secondary-button"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                  onClick={() =>
                    speakBujjiTeluguVoice(
                      `${selectedMandal.name} మండలం పబ్లిక్ హెల్త్ స్టేటస్: ఖాళీ బెడ్స్: ${selectedMandal.activeBedsAvailable}. 108 అంబులెన్సులు: ${selectedMandal.activeAmbulancesAvailable}. డాక్టర్ సాంద్రత: ${selectedMandal.deployedSpecialistDensity}. మొత్తం స్క్రీనింగ్ అయిన వారు ${selectedMandal.screenedTotal} మంది.`
                    )
                  }
                >
                  🔊 BUJJI AI వాయిస్ (Audio)
                </button>
              </div>
            </div>

            {/* Operational Clinical Metrics (Bed Availability, Ambulances, Clinician Density) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '1.2rem' }}>
              <div style={{ background: '#f0f9ff', border: '1.5px solid #38bdf8', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🛏️</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0369a1' }}>ACTIVE BED AVAILABILITY</strong>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0c4a6e' }}>
                  {selectedMandal.activeBedsAvailable} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {selectedMandal.totalBedCapacity} Total Beds</span>
                </div>
                <small style={{ color: '#0284c7', display: 'block', marginTop: '4px' }}>Real-time Vacant ICU, Oxygen &amp; General Wards</small>
              </div>

              <div style={{ background: '#fff7ed', border: '1.5px solid #fb923c', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🚑</span>
                  <strong style={{ fontSize: '0.88rem', color: '#c2410c' }}>108 &amp; FEEDER AMBULANCES</strong>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c2d12' }}>
                  {selectedMandal.activeAmbulancesAvailable} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Active Units</span>
                </div>
                <small style={{ color: '#ea580c', display: 'block', marginTop: '4px' }}>108 Highway Ambulances &amp; 4x4 Hill Feeder Jeeps on Duty</small>
              </div>

              <div style={{ background: '#f0fdf4', border: '1.5px solid #4ade80', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>👨‍⚕️</span>
                  <strong style={{ fontSize: '0.88rem', color: '#15803d' }}>CLINICIAN &amp; SPECIALIST DENSITY</strong>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d' }}>
                  {selectedMandal.deployedSpecialistDensity} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>per 10,000 Population</span>
                </div>
                <small style={{ color: '#16a34a', display: 'block', marginTop: '4px' }}>Deployed MOs, Dentists &amp; Visiting Oncologists</small>
              </div>
            </div>

            {/* Clinical Statistics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Oral Screening Coverage</small>
                <strong style={{ fontSize: '1.25rem', color: '#1e3a8a' }}>{selectedMandal.screenedTotal} Citizens</strong>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '2px' }}>↑ 18.4% this month</div>
              </div>

              <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <small style={{ color: '#991b1b', display: 'block', marginBottom: '4px' }}>Suspected OPMD / Dysplasia</small>
                <strong style={{ fontSize: '1.25rem', color: '#dc2626' }}>{selectedMandal.highRiskOpmd} Patients</strong>
                <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '2px' }}>
                  Rate: {((selectedMandal.highRiskOpmd / selectedMandal.screenedTotal) * 100).toFixed(1)}% of screened
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <small style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>Biopsies Expedited</small>
                <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>{selectedMandal.biopsiesReferred} Referred</strong>
                <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>100% with QR Referral Slips</div>
              </div>

              <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <small style={{ color: '#1e40af', display: 'block', marginBottom: '4px' }}>Grassroots Workforce</small>
                <strong style={{ fontSize: '1.25rem', color: '#1d4ed8' }}>{selectedMandal.activeAshaWorkers} ASHA Leads</strong>
                <div style={{ fontSize: '0.72rem', color: '#1d4ed8', marginTop: '2px' }}>Equipped with AI Mobile Kits</div>
              </div>
            </div>
          </div>

          {/* 11-Mandal Breakdown Table (Strict k-Anonymity N < 5 Suppression) */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#2563eb',
                  }}
                >
                  MANDAL-WISE SURVEILLANCE MATRIX
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  7-Mandal Breakdown Table (Strict k-Anonymity N &lt; 5 Suppression)
                </h3>
              </div>
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  border: '1px solid #86efac',
                }}
              >
                k-Anonymity Active (N &lt; 5 Suppressed)
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>MANDAL</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>PRIMARY HEALTH HUB</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>TOTAL SCREENINGS</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>SUSPICIOUS AI DETECTIONS</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>CONFIRMED REFERRALS (DH PADERU)</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>EMERGENCY BIOPSY PIPELINE</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>ACTIVE TRANSPORT MISSIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {ITDA_MANDAL_SURVEILLANCE_ROWS.map((row, idx) => {
                    const isEven = idx % 2 === 0
                    return (
                      <tr
                        key={row.mandal}
                        style={{
                          background: isEven ? '#ffffff' : '#fafafa',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{row.mandal}</td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{row.phcHub}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{formatKAnonymityCell(row.screenings)}</td>
                        <td style={{ padding: '10px 14px', color: row.suspiciousAiDetections < 5 ? '#94a3b8' : '#b91c1c', fontStyle: row.suspiciousAiDetections < 5 ? 'italic' : 'normal', fontWeight: row.suspiciousAiDetections < 5 ? 400 : 700 }}>
                          {formatKAnonymityCell(row.suspiciousAiDetections)}
                        </td>
                        <td style={{ padding: '10px 14px', color: row.confirmedReferrals < 5 ? '#94a3b8' : '#d97706', fontStyle: row.confirmedReferrals < 5 ? 'italic' : 'normal', fontWeight: row.confirmedReferrals < 5 ? 400 : 700 }}>
                          {formatKAnonymityCell(row.confirmedReferrals)}
                        </td>
                        <td style={{ padding: '10px 14px', color: row.biopsyPipeline < 5 ? '#94a3b8' : '#7c3aed', fontStyle: row.biopsyPipeline < 5 ? 'italic' : 'normal', fontWeight: row.biopsyPipeline < 5 ? 400 : 700 }}>
                          {formatKAnonymityCell(row.biopsyPipeline)}
                        </td>
                        <td style={{ padding: '10px 14px', color: row.transportMissions < 5 ? '#94a3b8' : '#0284c7', fontStyle: row.transportMissions < 5 ? 'italic' : 'normal', fontWeight: row.transportMissions < 5 ? 400 : 700 }}>
                          {formatKAnonymityCell(row.transportMissions)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                fontSize: '0.80rem',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🔒</span>
              <span>
                <strong>Privacy Guarantee:</strong> Individual patient names, phone numbers, and photos are strictly blocked for &apos;ITDA_PROJECT_OFFICER&apos; and &apos;DISTRICT_OFFICER&apos; roles. Cells with fewer than 5 observations are suppressed to prevent re-identification in small tribal hamlets.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITALS & HEALTHCARE FACILITIES */}
      {activeTab === 'HOSPITALS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                🏥 Hospital &amp; Referral Healthcare Nodes
              </h3>
              <small style={{ color: '#64748b' }}>
                Managed facilities across Alluri Sitharama Raju District
              </small>
            </div>

            <button
              type="button"
              onClick={() => {
                setHospName('')
                setHospMandal('Paderu')
                setHospType('PHC')
                setHospBeds(30)
                setHospPhone('')
                setActiveModal('ADD_HOSPITAL')
              }}
              style={{
                background: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              ➕ Add Hospital
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {hospitals.map((hosp) => (
              <div
                key={hosp.id}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#1e40af',
                        background: '#dbeafe',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {hosp.type.replace('_', ' ')}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0 0' }}>
                      {hosp.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditHospital(hosp)}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Edit
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem', color: '#475569' }}>
                  <div>
                    <span>📍 Mandal:</span> <strong>{hosp.mandal}</strong>
                  </div>
                  <div>
                    <span>🛏️ Bed Capacity:</span> <strong>{hosp.bedCapacity}</strong>
                  </div>
                  <div>
                    <span>🩺 Clinicians:</span> <strong>{hosp.activeDoctors} On Roster</strong>
                  </div>
                  <div>
                    <span>📞 Phone:</span> <strong>{hosp.contactPhone}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DOCTORS & SPECIALISTS ROSTER */}
      {activeTab === 'ROSTER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                🩺 Specialist &amp; Medical Officer Roster
              </h3>
              <small style={{ color: '#64748b' }}>
                Real-time duty toggle and credential verification for oncology tele-clinicians
              </small>
            </div>

            <button
              type="button"
              onClick={() => {
                setDocName('')
                setDocSpec('Oral Oncology & Maxillofacial Specialist')
                setDocHospId('HOSP-ASR-01')
                setDocApmc('')
                setDocPhone('')
                setDocEmail('')
                setActiveModal('ADD_DOCTOR')
              }}
              style={{
                background: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              ➕ Add Doctor to Roster
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
            {doctors.map((doc) => {
              const isOnDuty = doc.dutyStatus === 'ON_DUTY'
              return (
                <div
                  key={doc.id}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {doc.fullName}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isOnDuty ? '#dcfce7' : '#f1f5f9',
                            color: isOnDuty ? '#15803d' : '#64748b',
                          }}
                        >
                          {isOnDuty ? '● ON DUTY' : '○ OFF DUTY'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                        {doc.specialization}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditDoctor(doc)}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ marginBottom: '2px' }}>
                      {doc.practiceType === 'PRIVATE_VISITING' ? (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #fde68a' }}>
                          🏥 Empanelled Visiting Specialist · Consultation Fee: ₹{doc.consultationFee || 250}
                        </span>
                      ) : (
                        <span style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #a7f3d0' }}>
                          🏛️ Government Public Service Doctor (Standard Public Service ₹0 / Aarogyasri)
                        </span>
                      )}
                    </div>
                    <div>🏥 <strong>Hospital Posting:</strong> {doc.hospitalName} ({doc.mandal})</div>
                    <div>📜 <strong>APMC Council Reg:</strong> {doc.apmcRegNumber}</div>
                    <div>🎓 <strong>Degrees &amp; Alma Mater:</strong> {(doc.degrees || ['MBBS / BDS']).join(', ')} · {doc.almaMater || 'Andhra Medical College'}</div>
                    <div>⏳ <strong>Clinical Experience:</strong> {doc.experienceYears || 10} Years · 📋 <strong>Active Caseload:</strong> {doc.activeCaseload || 15} Patients</div>
                    <div>📞 <strong>Contact:</strong> {doc.phone} · {doc.email}</div>
                  </div>

                  {/* Dynamic Duty Status Toggle Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Live Availability:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleDutyStatus(doc.id)}
                      style={{
                        background: isOnDuty ? '#fee2e2' : '#dcfce7',
                        color: isOnDuty ? '#b91c1c' : '#15803d',
                        border: `1px solid ${isOnDuty ? '#f87171' : '#86efac'}`,
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isOnDuty ? '🔴 Mark Off Duty' : '🟢 Set On Duty'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ASR DISTRICT PHC DOCTORS & ABDM REGISTRY */}
      {activeTab === 'ABDM_REGISTRY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Registry Header */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#0284c7',
                    background: '#e0f2fe',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  OFFICIAL AYUSHMAN BHARAT DIGITAL MISSION (ABDM) REGISTRY
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  🏛️ ASR District PHC-Wise Doctors Directory &amp; Healthcare Infrastructure Registry
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Live registry of 62 Primary Health Centres (PHCs) + 4 Apex Referral Hospitals across 22 Tribal Mandals of Alluri Sitharama Raju District. All Medical Officers mapped with official ABDM HPR IDs.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() =>
                    speakBujjiTeluguVoice(
                      `అల్లూరి సీతారామరాజు జిల్లా ఆరోగ్య రిజిస్ట్రీ: మొత్తం 66 ఆరోగ్య కేంద్రాలు ఉన్నాయి. ఇందులో 62 ప్రాథమిక ఆరోగ్య కేంద్రాలు, మరియు 4 ప్రధాన ఆసుపత్రులు ఉన్నాయి. 66 మంది వైద్యాధికారులు డ్యూటీలో ఉన్నారు. అందరికీ అధికారిక హెచ్‌పీఆర్ ఐడీ ధ్రువీకరించబడింది.`
                    )
                  }
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    color: '#15803d',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🔊 BUJJI AI జిల్లా సారాంశం (Audio)
                </button>
              </div>
            </div>

            {/* 4 Live Operational KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '1.25rem' }}>
              <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🏥</span>
                  <strong style={{ fontSize: '0.82rem', color: '#0369a1' }}>66 ABDM REGISTERED FACILITIES</strong>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c4a6e' }}>
                  {asrSummary.totalFacilities} <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>({asrSummary.phcsCount} PHCs + {asrSummary.hospitalsCount} Apex)</span>
                </div>
                <small style={{ color: '#0284c7', display: 'block', marginTop: '4px' }}>100% ABDM Facility Code Verified · ITDA Paderu</small>
              </div>

              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.2rem' }}>👨‍⚕️</span>
                  <strong style={{ fontSize: '0.82rem', color: '#15803d' }}>66 VERIFIED MEDICAL OFFICERS</strong>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#14532d' }}>
                  {asrSummary.verifiedDoctorsCount} <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>(100% HPR ID Certified)</span>
                </div>
                <small style={{ color: '#16a34a', display: 'block', marginTop: '4px' }}>National Healthcare Professional Registry (HPR ID) Active</small>
              </div>

              <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🛏️</span>
                  <strong style={{ fontSize: '0.82rem', color: '#1e40af' }}>1,640 ACTIVE BED CAPACITY</strong>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a' }}>
                  {asrSummary.vacantBeds} <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600 }}>Vacant ({asrSummary.occupancyRate}% Occ)</span>
                </div>
                <small style={{ color: '#2563eb', display: 'block', marginTop: '4px' }}>General, High-Dependency &amp; Oxygen Beds Tracked</small>
              </div>

              <div style={{ background: '#fff7ed', border: '1.5px solid #fdba74', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🚑</span>
                  <strong style={{ fontSize: '0.82rem', color: '#c2410c' }}>84 TRIBAL 4x4 &amp; 108 FLEET</strong>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c2d12' }}>
                  {asrSummary.totalAmbulances} <span style={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 600 }}>Vehicles Ready</span>
                </div>
                <small style={{ color: '#c2410c', display: 'block', marginTop: '4px' }}>Hill Terrain Feeder Ambulances &amp; ALS Highway Units</small>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '1.25rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ flex: '1 1 260px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                  🔍 SEARCH FACILITIES &amp; DOCTORS:
                </label>
                <input
                  type="text"
                  placeholder="Search by facility name, code (IN28...), doctor name, HPR ID..."
                  value={phcSearchQuery}
                  onChange={(e) => setPhcSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#ffffff',
                  }}
                />
              </div>

              <div style={{ minWidth: '180px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                  📍 FILTER BY MANDAL:
                </label>
                <select
                  value={phcMandalFilter}
                  onChange={(e) => setPhcMandalFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#ffffff',
                  }}
                >
                  <option value="ALL">All Mandals ({ASR_DISTRICT_FACILITIES.length} Facilities)</option>
                  {allMandalsList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: '160px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                  🏥 FACILITY TYPE:
                </label>
                <select
                  value={phcTypeFilter}
                  onChange={(e) => setPhcTypeFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#ffffff',
                  }}
                >
                  <option value="ALL">All Facility Types</option>
                  <option value="PHC">PHC (Primary Health Centre)</option>
                  <option value="CHC">CHC (Community Health Centre)</option>
                  <option value="AREA_HOSPITAL">Area Hospital</option>
                  <option value="DISTRICT_HOSPITAL">District Hospital</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', marginTop: 'auto' }}>
                {(phcSearchQuery || phcMandalFilter !== 'ALL' || phcTypeFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhcSearchQuery('')
                      setPhcMandalFilter('ALL')
                      setPhcTypeFilter('ALL')
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                Showing <strong>{filteredFacilities.length}</strong> of {ASR_DISTRICT_FACILITIES.length} facilities
              </div>
            </div>

            {/* ABDM Registry Facilities Data Table */}
            <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                }}
              >
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>#</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>FACILITY NAME &amp; ABDM CODE</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>TYPE &amp; MANDAL</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>MEDICAL OFFICER &amp; SPECIALIZATION</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>CONTACT / DIRECT CALL</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>NATIONAL HPR ID</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>BED CAPACITY</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>AMBULANCES</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>PRACTICE &amp; FEE</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>STATUS</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.74rem' }}>AUDIO</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                        No ABDM healthcare facilities found matching your search query or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredFacilities.map((fac, idx) => {
                      const isEven = idx % 2 === 0
                      const vacantBedsCount = fac.totalBeds - fac.activeBeds
                      return (
                        <tr
                          key={fac.facilityCode}
                          style={{
                            background: isEven ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#64748b' }}>{fac.slNo}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{fac.facilityName}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#0284c7', marginTop: '2px' }}>
                              CODE: {fac.facilityCode}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                background:
                                  fac.type === 'DISTRICT_HOSPITAL'
                                    ? '#fee2e2'
                                    : fac.type === 'AREA_HOSPITAL'
                                    ? '#fef3c7'
                                    : fac.type === 'CHC'
                                    ? '#e0e7ff'
                                    : '#f1f5f9',
                                color:
                                  fac.type === 'DISTRICT_HOSPITAL'
                                    ? '#b91c1c'
                                    : fac.type === 'AREA_HOSPITAL'
                                    ? '#b45309'
                                    : fac.type === 'CHC'
                                    ? '#3730a3'
                                    : '#475569',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.70rem',
                                fontWeight: 800,
                              }}
                            >
                              {fac.type.replace('_', ' ')}
                            </span>
                            <div style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                              📍 {fac.mandal}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{fac.medicalOfficerName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {fac.degrees} · {fac.specialization}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <a
                              href={`tel:${fac.contactNo}`}
                              style={{
                                color: '#2563eb',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#eff6ff',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              📞 {fac.contactNo}
                            </a>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#ecfdf5',
                                color: '#065f46',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid #a7f3d0',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                              }}
                            >
                              <span>✓</span>
                              <span>{fac.hprId}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>
                              {vacantBedsCount} / {fac.totalBeds} Beds
                            </div>
                            <small style={{ color: '#16a34a', fontSize: '0.70rem' }}>
                              {vacantBedsCount} Available
                            </small>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                background: '#fff7ed',
                                color: '#c2410c',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 800,
                                border: '1px solid #fed7aa',
                              }}
                            >
                              🚑 {fac.ambulancesAvailable}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                background: fac.practiceType === 'GOVERNMENT' ? '#f0fdf4' : '#fef3c7',
                                color: fac.practiceType === 'GOVERNMENT' ? '#15803d' : '#92400e',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.70rem',
                                fontWeight: 800,
                              }}
                            >
                              {fac.practiceType === 'GOVERNMENT' ? 'GOVT ₹0' : `VISITING ₹${fac.consultationFee}`}
                            </span>
                            <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '2px' }}>
                              Caseload: {fac.activeCaseload}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                              }}
                            >
                              ● ON DUTY
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button
                              type="button"
                              onClick={() =>
                                speakBujjiTeluguVoice(
                                  `${fac.facilityName}, మండలం: ${fac.mandal}. వైద్యాధికారి: ${fac.medicalOfficerName}. ఫోన్: ${fac.contactNo}. అందుబాటులో ఉన్న బెడ్స్ ${vacantBedsCount}. అంబులెన్సులు: ${fac.ambulancesAvailable}.`
                                )
                              }
                              title="Speak details in Telugu"
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                              }}
                            >
                              🔊
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.75rem 1.25rem',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '0.80rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🔒</span>
              <span>
                <strong>HIPAA &amp; DISHA Compliant Admin Portal:</strong> Individual patient names, phone numbers, and clinical photos are strictly shielded. This registry manages healthcare workforce, infrastructure, and facility readiness across ITDA Paderu.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT HOSPITAL */}
      {(activeModal === 'ADD_HOSPITAL' || activeModal === 'EDIT_HOSPITAL') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {activeModal === 'ADD_HOSPITAL' ? '🏥 Add New Healthcare Facility' : '✏️ Edit Hospital Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHospital} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Hospital / Health Center Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Area Hospital Araku Valley"
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Tribal Mandal
                  </label>
                  <select
                    value={hospMandal}
                    onChange={(e) => setHospMandal(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {INITIAL_MANDALS.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.teluguName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Facility Category
                  </label>
                  <select
                    value={hospType}
                    onChange={(e) => setHospType(e.target.value as HospitalItem['type'])}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="GGH">Government General Hospital (GGH)</option>
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                    <option value="AREA_HOSPITAL">Area Hospital</option>
                    <option value="CHC">Community Health Center (CHC)</option>
                    <option value="PHC">Primary Health Center (PHC)</option>
                    <option value="SUBCENTRE">Sub-Centre / Anganwadi Clinic</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Bed Capacity
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={hospBeds}
                    onChange={(e) => setHospBeds(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Official Helpline / Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 8935 241000"
                    value={hospPhone}
                    onChange={(e) => setHospPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓ Save Hospital Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT DOCTOR */}
      {(activeModal === 'ADD_DOCTOR' || activeModal === 'EDIT_DOCTOR') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {activeModal === 'ADD_DOCTOR' ? '🩺 Add Doctor to Hospital Roster' : '✏️ Edit Doctor Credentials'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Doctor Full Name &amp; Degree
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. V. Anitha Rao, MDS"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Clinical Specialization
                </label>
                <select
                  value={docSpec}
                  onChange={(e) => setDocSpec(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Oral Oncology & Maxillofacial Specialist">Oral Oncology &amp; Maxillofacial Specialist</option>
                  <option value="Oral Pathology & Preventive Dentistry">Oral Pathology &amp; Preventive Dentistry</option>
                  <option value="General Medicine & Telemedicine Clinician">General Medicine &amp; Telemedicine Clinician</option>
                  <option value="Primary Medical Officer & Rural Field Lead">Primary Medical Officer &amp; Rural Field Lead</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Assigned Hospital
                  </label>
                  <select
                    value={docHospId}
                    onChange={(e) => setDocHospId(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.mandal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    APMC Medical Council Reg #
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APMC-78421-MDS"
                    value={docApmc}
                    onChange={(e) => setDocApmc(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 94401 23456"
                    value={docPhone}
                    onChange={(e) => setDocPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@asr.health.gov.in"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#1e3a8a', color: '#ffffff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓ Save Doctor to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Interactive Figma Animation Motion Mandal Showcase Modal */}
      {showMandalModal && (
        <div
          className="telemedicine-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowMandalModal(false)}
          style={{ animation: 'fadeIn 0.25s ease' }}
        >
          <div
            className="workflow-card figma-card-morph"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '740px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: `2px solid ${selectedMandal.mapColor}`,
              boxShadow: `0 24px 48px -12px ${selectedMandal.mapColor}40`,
              animation: 'figmaSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${selectedMandal.mapColor}20`,
                    color: selectedMandal.mapColor,
                    textTransform: 'uppercase',
                  }}
                >
                  📍 11-Mandal GIS Clinical &amp; Cultural Dossier
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedMandal.name} ({selectedMandal.teluguName})
                </h3>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Altitude: {selectedMandal.altitude} · Alluri Sitharama Raju Agency
                </span>
              </div>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={() => setShowMandalModal(false)}
                style={{ fontSize: '1.2rem', padding: '4px 10px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Vector Topographic Mandal Map with Pulse Nodes */}
            <div
              style={{
                margin: '1rem 0',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                padding: '16px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '8px' }}>
                <span>🗺️ TOPOGRAPHIC GIS SATELLITE RADAR</span>
                <span>LAT/LONG: 18.0833° N, 82.6667° E</span>
              </div>
              <svg viewBox="0 0 500 160" style={{ width: '100%', height: '140px' }}>
                <defs>
                  <linearGradient id="mandalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={selectedMandal.mapColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {/* Elevation Contours */}
                <path d="M 20 130 Q 120 40 250 80 T 480 50 L 480 150 L 20 150 Z" fill="url(#mandalGrad)" />
                <path d="M 40 140 Q 150 70 280 100 T 460 80" fill="none" stroke={selectedMandal.mapColor} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
                <path d="M 10 120 Q 140 30 260 60 T 490 30" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.8" />

                {/* Animated PHC Nodes */}
                <circle cx="150" cy="70" r="7" fill={selectedMandal.mapColor}>
                  <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="165" y="74" fill="#ffffff" fontSize="11" fontWeight="bold">PHC-01 Hub</text>

                <circle cx="320" cy="90" r="5" fill="#22c55e" />
                <text x="332" y="94" fill="#86efac" fontSize="10">Sub-Center Clinic</text>

                <circle cx="410" cy="55" r="5" fill="#f59e0b" />
                <text x="422" y="59" fill="#fde047" fontSize="10">108 4x4 Post</text>
              </svg>
            </div>

            {/* Real-Time Healthcare Logistics & Resource Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', margin: '1rem 0' }}>
              <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '12px', padding: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', display: 'block', marginBottom: '4px' }}>
                  🛏️ ACTIVE BED VACANCY
                </span>
                <strong style={{ fontSize: '1.05rem', color: '#0c4a6e' }}>{selectedMandal.activeBedsAvailable} / {selectedMandal.totalBedCapacity} Available</strong>
              </div>

              <div style={{ background: '#fff7ed', border: '1.5px solid #fdba74', borderRadius: '12px', padding: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c2410c', display: 'block', marginBottom: '4px' }}>
                  🚑 108 FLEET ATTENDANCE
                </span>
                <strong style={{ fontSize: '1.05rem', color: '#7c2d12' }}>{selectedMandal.activeAmbulancesAvailable} Units Ready</strong>
              </div>

              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803d', display: 'block', marginBottom: '4px' }}>
                  👨‍⚕️ CLINICIAN DENSITY
                </span>
                <strong style={{ fontSize: '1.05rem', color: '#14532d' }}>{selectedMandal.deployedSpecialistDensity} / 10k Pop</strong>
              </div>
            </div>

            {/* Clinical Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="workflow-button"
                onClick={() =>
                  speakBujjiTeluguVoice(
                    `${selectedMandal.name} మండలం ఆరోగ్య సామర్థ్యం: అందుబాటులో ఉన్న బెడ్స్ ${selectedMandal.activeBedsAvailable}. 108 అంబులెన్సులు ${selectedMandal.activeAmbulancesAvailable}. ఈ మండలంలో ${selectedMandal.phcCount} ప్రాథమిక ఆరోగ్య కేంద్రాలు ఉన్నాయి.`
                  )
                }
              >
                🔊 BUJJI AI వాయిస్ గైడ్
              </button>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={() => setShowMandalModal(false)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

