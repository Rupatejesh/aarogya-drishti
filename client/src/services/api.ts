
import axios from 'axios'

const localHostname =
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'localhost'
    ? window.location.hostname
    : 'localhost'

const resolveApiBaseUrl = (): string => {
  return 'https://aarogya-drishti-9g70.onrender.com/api';
};

const API_BASE_URL = 'https://aarogya-drishti-9g70.onrender.com/api';

const readCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : undefined
}

let csrfToken: string | undefined
let csrfTokenRequest: Promise<string> | undefined

const getCsrfToken = async (forceRefresh = false): Promise<string> => {
  if (!forceRefresh) {
    const cookieToken = readCookie('aarogya_csrf')
    if (cookieToken) {
      csrfToken = cookieToken
      return cookieToken
    }
    if (csrfToken) return csrfToken
  }
  if (!csrfTokenRequest) {
    csrfTokenRequest = axios
      .get<{ data?: { csrfToken?: string } }>(`${API_BASE_URL}/auth/csrf`, {
        withCredentials: true,
        timeout: 15000,
      })
      .then((response) => {
        const token = readCookie('aarogya_csrf') || response.data.data?.csrfToken
        if (!token) throw new Error('The server did not issue a CSRF token.')
        csrfToken = token
        return token
      })
      .finally(() => {
        csrfTokenRequest = undefined
      })
  }
  return csrfTokenRequest
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Send a legacy token only until the server migrates the session to a cookie.
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('aarogya_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // If payload is FormData, remove application/json header so browser sets multipart boundary automatically
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type']
  }

  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() ?? '')) {
    const token = await getCsrfToken().catch(() => '')
    if (token) {
      config.headers['X-CSRF-Token'] = token
    }
  }
  return config
})

// Handle expired or invalid sessions.
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalConfig = error.config as (typeof error.config & { _csrfRetried?: boolean }) | undefined
    if (
      error.response?.status === 403 &&
      originalConfig &&
      !originalConfig._csrfRetried &&
      ['post', 'put', 'patch', 'delete'].includes(originalConfig.method?.toLowerCase() ?? '')
    ) {
      originalConfig._csrfRetried = true
      csrfToken = undefined
      const refreshedToken = await getCsrfToken(true)
      originalConfig.headers = originalConfig.headers ?? {}
      originalConfig.headers['X-CSRF-Token'] = refreshedToken
      return api.request(originalConfig)
    }

    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || '')
      const isAuthRoute =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/send-otp') ||
        requestUrl.includes('/auth/verify-otp') ||
        requestUrl.includes('/auth/csrf')

      // Never destroy active session on auth attempts or auxiliary background requests.
      // Only notify unauthorized if an explicit session check to /users/me rejected an active server session.
      if (!isAuthRoute && requestUrl.includes('/users/me')) {
        const token = localStorage.getItem('aarogya_token')
        // Do not kick out resilient local/offline accounts
        if (token && !token.startsWith('aarogya-jwt-') && !token.startsWith('local-')) {
          localStorage.removeItem('aarogya_token')
          localStorage.removeItem('aarogya_user')
          csrfToken = undefined
          window.dispatchEvent(new Event('aarogya:unauthorized'))
        }
      }
    }

    return Promise.reject(error)
  },
)

export interface AuthUser {
  id: string
  fullName: string
  email?: string
  phone?: string
  role:
    | 'PATIENT'
    | 'ASHA_WORKER'
    | 'MEDICAL_OFFICER'
    | 'SPECIALIST'
    | 'DRONE_OPERATOR'
    | 'HOSPITAL_MANAGER'
    | 'DISTRICT_OFFICER'
    | 'ITDA_PROJECT_OFFICER'
    | 'ADMIN'
  assignedPHCId?: string
  mandal?: string
  district?: string
  maaUidn?: string
  isVerified?: boolean
  specialization?: string
  hospitalId?: string
  fatherName?: string
  degrees?: string[]
  almaMater?: string
  experienceYears?: number
  practiceType?: 'GOVERNMENT' | 'PRIVATE_VISITING'
  activeCaseload?: number
  medicalRegistrationNumber?: string
}

export interface LoginResponse {
  user: AuthUser
  token?: string
  maaUidn?: string
}

export interface PatientRecord {
  _id: string
  id?: string
  patientId: string
  maaUidn?: string
  fullName: string
  fatherName?: string
  aadhaarNumber?: string
  dateOfBirth?: string
  age?: number
  sex: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_RECORDED'
  phone?: string
  preferredLanguage?: string
  alternateContact?: string
  assignedASHAWorker?: string | { _id?: string; fullName: string }
  address: {
    village: string
    habitation?: string
    gramPanchayat?: string
    mandal: string
    phcId: string
    district: string
  }
  exposureHistory?: {
    tobaccoUse?: 'NEVER' | 'CURRENT' | 'FORMER' | 'NOT_RECORDED'
    tobaccoTypes?: string[]
    tobaccoDurationYears?: number
    alcoholUse?: 'YES' | 'NO' | 'NOT_RECORDED'
    otherExposures?: string[]
  }
  habits?: {
    substance: string
    frequency: string
    durationYears?: number
    burningScore?: number
  }[]
  registrationStatus: 'ACTIVE' | 'INACTIVE'
}

export interface ConsentRecord {
  _id: string
  purpose: string
  granted: boolean
  consentVersion: string
  language: 'TELUGU' | 'ENGLISH' | 'HINDI'
  recordedAt: string
  withdrawnAt?: string
  withdrawalReason?: string
  notes?: string
}

export interface OralMedication {
  name: string
  dosage: string
  frequency: string
  duration: string
  route: string
  instructions: string
}

export interface ScreeningAiAssessment {
  result: string
  modelVersion: string
  disclaimer: string
  assessedAt: string
  imageQuality?: 'ADEQUATE' | 'INADEQUATE' | 'UNCERTAIN'
  visibleFeatures?: string[]
  reportedOralRegion?: string
  preliminaryRiskCategory?:
    | 'LOW_RISK'
    | 'MODERATE_RISK'
    | 'HIGH_RISK'
    | 'URGENT_EVALUATION_RECOMMENDED'
  detectedCondition?: string
  icd10Code?: string
  severityStage?: string
  confidenceScore?: number
  clinicalExplanation?: string
  differentialDiagnoses?: string[]
  recommendedTests?: string[]
  medications?: OralMedication[]
  lifestyleAdvice?: string[]
  teluguSummary?: string
  suggestedNextSteps?: string
  uncertaintyLimitations?: string
  boundingBox?: number[]
  isLiveAi?: boolean
  engineMode?: string
}

export interface ScreeningRecord {
  _id: string
  patient: string | PatientRecord
  screenedBy: string | { fullName: string; role: string }
  screeningDate: string
  symptoms: { name: string; duration?: string; bodySite?: string }[]
  examinationFindings: {
    bodySite: string
    observation: string
    notes?: string
  }[]
  tobaccoUse: string
  notes?: string
  clinicalStatus?: string
  screeningStatus: 'PENDING' | 'COMPLETED' | 'REQUIRES_REVIEW'
  images?: {
    site: string
    fileUrl: string
    sha256Hash: string
    qualityStatus: string
    capturedAt: string
  }[]
  aiAssessment?: ScreeningAiAssessment
  clinicalReviews?: ClinicalReviewRecord[]
}

export interface ClinicalReviewRecord {
  _id: string
  reviewedBy: string | { _id: string; fullName: string; role: string }
  reviewedAt: string
  decision: 'AGREE' | 'DISAGREE' | 'DEFER'
  clinicalObservations: string
  notes?: string
  referralRecommended: boolean
  referralReason?: string
}

export interface ASHAWorkerOption {
  id: string
  fullName: string
  assignedPHCId: string
  mandal: string
  district: string
}

export interface PatientListResponse {
  patients: PatientRecord[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface RegisteredPatient {
  id: string
  patientId: string
  maaUidn?: string
  fullName: string
  registrationStatus: 'ACTIVE' | 'INACTIVE'
}

export interface ReviewQueueResponse {
  screenings: ScreeningRecord[]
  pagination: PatientListResponse['pagination']
}

export interface AggregatePeriod {
  period: string
  screenings: { count: number | null; suppressed: boolean }
  referrals: { count: number | null; suppressed: boolean }
  diagnosticOrders: { count: number | null; suppressed: boolean }
  followUps: { count: number | null; suppressed: boolean }
}

export interface AggregateDashboardResponse {
  scopeSuppressed: boolean
  minimumGroupSize: number
  periods: AggregatePeriod[]
}

export interface ReferralRecord {
  _id: string
  screening: string
  patient: {
    _id: string
    patientId: string
    fullName?: string
    age?: number
    sex?: string
    address?: { village?: string; mandal?: string; phcId?: string }
    exposureHistory?: { tobaccoUse?: string }
  }
  assignedSpecialist?: { _id: string; fullName: string; role: string }
  referralReason: string
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY'
  referredTo: string
  facilityName: string
  appointmentDate?: string
  status:
    | 'CREATED'
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'RESCHEDULED'
    | 'COMPLETION_REVIEW'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'MISSED'
  notes?: string
}

export interface ReferralListResponse {
  referrals: ReferralRecord[]
  pagination: PatientListResponse['pagination']
}

export type DiagnosticStatus =
  | 'ADVISED'
  | 'SCHEDULED'
  | 'PERFORMED'
  | 'SAMPLE_COLLECTED'
  | 'REPORT_PENDING'
  | 'REPORT_RECEIVED'
  | 'UNDER_CLINICIAN_REVIEW'
  | 'REVIEWED'
  | 'CANCELLED'

export interface DiagnosticOrderRecord {
  _id: string
  patient: string | PatientRecord
  screening?: string | ScreeningRecord
  referral?: string | ReferralRecord
  diagnosticType: 'BIOPSY' | 'HISTOPATHOLOGY' | 'CT_SCAN' | 'MRI' | 'OTHER'
  clinicalReason: string
  facilityName?: string
  appointmentDate?: string
  status: DiagnosticStatus
  reportReceivedAt?: string
  reviewNotes?: string
  notes?: string
  results: { resultText: string; recordedAt: string }[]
}

export interface FollowUpRecord {
  _id: string
  patient: string | PatientRecord
  screening?: string | ScreeningRecord
  referral?: string | ReferralRecord
  assignedWorker: string | { _id: string; fullName: string; role: string }
  dueAt: string
  status: 'PLANNED' | 'CONTACTED' | 'COMPLETED' | 'MISSED' | 'CANCELLED'
  visitNotes: { text: string; recordedAt: string }[]
}

interface AccountProvisioningFields {
  fullName: string
  email?: string
  phone?: string
  password: string
}

export type ProvisionableAccountRole =
  | 'MEDICAL_OFFICER'
  | 'SPECIALIST'
  | 'ASHA_WORKER'
  | 'DISTRICT_OFFICER'
  | 'ITDA_PROJECT_OFFICER'

export type ProvisionAccountInput =
  | (AccountProvisioningFields & {
      role: 'MEDICAL_OFFICER' | 'SPECIALIST' | 'ASHA_WORKER'
      assignedPHCId: string
      mandal: string
      district?: string
    })
  | (AccountProvisioningFields & {
      role: 'DISTRICT_OFFICER' | 'ITDA_PROJECT_OFFICER'
      district: string
    })

export const provisionAccount = async (
  account: ProvisionAccountInput,
): Promise<void> => {
  if (account.role === 'MEDICAL_OFFICER' || account.role === 'SPECIALIST') {
    await api.post('/users/staff', account)
    return
  }

  if (account.role === 'ASHA_WORKER') {
    await api.post('/users/asha-worker', {
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      password: account.password,
      assignedPHCId: account.assignedPHCId,
      mandal: account.mandal,
      district: account.district,
    })
    return
  }

  const { role, ...officer } = account
  const endpoint =
    role === 'DISTRICT_OFFICER'
      ? '/users/district-officer'
      : '/users/itda-project-officer'
  await api.post(endpoint, officer)
}

export const login = async (
  identifier: string,
  password: string,
): Promise<LoginResponse> => {
  await getCsrfToken().catch(() => '')
  const response = await api.post('/auth/login', {
    identifier,
    password,
  })

  const result = response.data.data as LoginResponse

  if (!result?.user?.role) {
    throw new Error('The server returned an invalid login response.')
  }

  if (result.token) {
    localStorage.setItem('aarogya_token', result.token)
  }
  localStorage.setItem('aarogya_user', JSON.stringify(result.user))

  return result
}

export const registerUser = async (data: {
  fullName: string
  fatherName?: string
  aadhaarNumber?: string
  phone: string
  email?: string
  password: string
  role?: string
  mandal?: string
  village?: string
  age?: number
  gender?: string
}): Promise<LoginResponse> => {
  await getCsrfToken().catch(() => '')
  const response = await api.post('/auth/register', data)
  const result = response.data.data as LoginResponse

  if (!result?.user?.role) {
    throw new Error('The server returned an invalid registration response.')
  }

  if (result.token) {
    localStorage.setItem('aarogya_token', result.token)
  }
  localStorage.setItem('aarogya_user', JSON.stringify(result.user))

  return result
}

export interface OtpSendResponse {
  phone: string
  otp: string
  debugOtp?: string
  expiresIn: number
}

export const sendOtp = async (phone: string): Promise<OtpSendResponse> => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10)
  await getCsrfToken().catch(() => '')
  const response = await api.post('/auth/send-otp', { phone: cleanPhone })
  const data = response.data.data as OtpSendResponse
  return {
    ...data,
    debugOtp: response.data.debugOtp || data.debugOtp || data.otp,
  }
}

export const verifyOtp = async (
  phone: string,
  otp: string,
): Promise<LoginResponse> => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10)
  await getCsrfToken().catch(() => '')
  const response = await api.post('/auth/verify-otp', { phone: cleanPhone, otp: otp.trim() })
  const result = response.data.data as LoginResponse

  if (!result?.user?.role) {
    throw new Error('The server returned an invalid OTP login response.')
  }

  if (result.token) {
    localStorage.setItem('aarogya_token', result.token)
  }
  localStorage.setItem('aarogya_user', JSON.stringify(result.user))
  return result
}

export const logout = () => {
  localStorage.removeItem('aarogya_token')
  localStorage.removeItem('aarogya_user')
  csrfToken = undefined
}

export const getCurrentUser = async (): Promise<AuthUser> => {
  await getCsrfToken().catch(() => '')
  const response = await api.get('/users/me')
  const user = response.data.data as AuthUser
  if (!user?.id || !user.role) {
    throw new Error('The server returned an invalid user profile.')
  }
  localStorage.setItem('aarogya_user', JSON.stringify(user))
  return user
}

export const restoreSession = async (): Promise<AuthUser> => {
  try {
    return await getCurrentUser()
  } catch (error) {
    const cached = localStorage.getItem('aarogya_user')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as AuthUser
        if (parsed?.role) return parsed
      } catch {
        // invalid JSON, ignore
      }
    }
    throw error
  }
}

export const endSession = async (): Promise<void> => {
  try {
    await api.post('/auth/logout').catch(() => {})
  } finally {
    logout()
  }
}

export const getPatients = async (): Promise<PatientListResponse> => {
  const response = await api.get('/patients', {
    params: { page: 1, limit: 100 },
  })
  return response.data.data as PatientListResponse
}

export const getMyPatientRecord = async (): Promise<PatientRecord> => {
  const response = await api.get('/patients/me')
  return response.data.data as PatientRecord
}

export const getPatient = async (id: string): Promise<PatientRecord> => {
  const response = await api.get(`/patients/${encodeURIComponent(id)}`)
  return response.data.data as PatientRecord
}

export const registerPatient = async (
  patient: Record<string, unknown>,
): Promise<RegisteredPatient> => {
  const response = await api.post('/patients', patient)
  return response.data.data as RegisteredPatient
}

export const getPatientConsents = async (
  patientId: string,
): Promise<ConsentRecord[]> => {
  const response = await api.get(
    `/patients/${encodeURIComponent(patientId)}/consents`,
  )
  return response.data.data as ConsentRecord[]
}

export const recordOralScreeningConsent = async (
  patientId: string,
  consent: {
    purpose?:
      | 'ORAL_SCREENING'
      | 'IMAGE_CAPTURE'
      | 'IMAGE_CAPTURE_AND_STORAGE'
      | 'AI_ASSISTED_DEMONSTRATION'
    consentVersion: string
    language: 'TELUGU' | 'ENGLISH' | 'HINDI'
    notes?: string
  },
): Promise<ConsentRecord> => {
  const response = await api.post(
    `/patients/${encodeURIComponent(patientId)}/consents`,
    consent,
  )
  return response.data.data as ConsentRecord
}

export const recordImageCaptureConsent = async (
  patientId: string,
  language: 'TELUGU' | 'ENGLISH' | 'HINDI' = 'TELUGU',
  notes?: string,
): Promise<ConsentRecord> =>
  recordOralScreeningConsent(patientId, {
    purpose: 'IMAGE_CAPTURE',
    consentVersion: '1.0',
    language,
    ...(notes ? { notes } : {}),
  })

export const withdrawOralScreeningConsent = async (
  patientId: string,
  reason?: string,
): Promise<ConsentRecord> => {
  const response = await api.post(
    `/patients/${encodeURIComponent(patientId)}/consents/ORAL_SCREENING/withdraw`,
    { reason },
  )
  return response.data.data as ConsentRecord
}

export const getASHAWorkers = async (): Promise<ASHAWorkerOption[]> => {
  const response = await api.get('/users/asha-workers')
  return response.data.data as ASHAWorkerOption[]
}

export const assignASHAWorker = async (
  patientId: string,
  ashaWorkerId: string,
): Promise<void> => {
  await api.patch(`/patients/${encodeURIComponent(patientId)}/assign-asha`, {
    ashaWorkerId,
  })
}

export const createScreening = async (
  screening: Record<string, unknown>,
): Promise<ScreeningRecord> => {
  const response = await api.post('/screenings', screening)
  return response.data.data as ScreeningRecord
}

export const uploadAndAnalyzeScreeningImage = async (
  screeningId: string,
  formData: FormData,
): Promise<ScreeningRecord> => {
  const response = await api.post(
    `/screenings/${encodeURIComponent(screeningId)}/analyze-image`,
    formData,
    {
      timeout: 120000,
    },
  )
  return response.data.data as ScreeningRecord
}

export interface DirectScreeningAnalysisResult {
  aiAssessment: ScreeningAiAssessment
  sha256Hash: string
  fileUrl?: string
  analyzedAt: string
}

export const analyzeDirectOralImage = async (
  formData: FormData,
): Promise<DirectScreeningAnalysisResult> => {
  const response = await api.post('/screenings/analyze-direct', formData, {
    timeout: 120000,
  })
  return response.data.data as DirectScreeningAnalysisResult
}

export const resolveMediaUrl = (fileUrl: string): string => {
  if (!fileUrl) return ''
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('data:')) {
    return fileUrl
  }
  const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${serverOrigin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
}

export const getPatientScreeningHistory = async (
  patientId: string,
): Promise<ScreeningRecord[]> => {
  const response = await api.get(
    `/screenings/patient/${encodeURIComponent(patientId)}`,
  )
  return response.data.data as ScreeningRecord[]
}

export const getScreeningReviewQueue = async (): Promise<ReviewQueueResponse> => {
  const response = await api.get('/screenings/review-queue', {
    params: { page: 1, limit: 100 },
  })
  return response.data.data as ReviewQueueResponse
}

export const getAggregateDashboard = async (): Promise<AggregateDashboardResponse> => {
  const response = await api.get('/dashboards/aggregate')
  return response.data.data as AggregateDashboardResponse
}

export const getReferrals = async (): Promise<ReferralListResponse> => {
  const response = await api.get('/referrals', {
    params: { page: 1, limit: 100 },
  })
  return response.data.data as ReferralListResponse
}

export const updateReferralStatus = async (
  referralId: string,
  update: {
    status: 'SCHEDULED' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETION_REVIEW' | 'CANCELLED' | 'MISSED'
    appointmentDate?: string
    note?: string
  },
): Promise<void> => {
  await api.patch(`/referrals/${encodeURIComponent(referralId)}/status`, update)
}

export const reviewReferralCompletion = async (
  referralId: string,
  review: { approved: boolean; note: string },
): Promise<void> => {
  await api.post(
    `/referrals/${encodeURIComponent(referralId)}/completion-review`,
    review,
  )
}

export const createReferral = async (referral: {
  screeningId: string
  assignedSpecialistId?: string
  referralReason: string
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY'
  referredTo: string
  facilityName: string
  appointmentDate?: string
  notes?: string
}): Promise<void> => {
  await api.post('/referrals', referral)
}

export interface HospitalRecord {
  _id: string
  hospitalId: string
  name: string
  type: 'PHC' | 'CHC' | 'DISTRICT_HOSPITAL' | 'TERTIARY_REFERRAL' | 'GGH' | 'AREA_HOSPITAL' | 'SUBCENTRE'
  mandal: string
  district: string
  address: string
  contactPhone: string
  facilities: string[]
  workingHours: string
  totalBedCapacity?: number
  activeBedsAvailable?: number
  activeAmbulancesAvailable?: number
  isActive: boolean
}

export interface SpecialistOption {
  id: string
  _id: string
  fullName: string
  email?: string
  phone?: string
  assignedPHCId?: string
  mandal?: string
  district?: string
  maaUidn?: string
  isVerified?: boolean
  medicalRegistrationNumber?: string
  specialization: string
  degrees?: string[]
  almaMater?: string
  experienceYears?: number
  practiceType?: 'GOVERNMENT' | 'PRIVATE_VISITING'
  activeCaseload?: number
  hospitalId?: string
  hospitalName: string
  consultationFee?: number
  availableDays?: string[]
  timeSlots?: string[]
}

export interface OwnershipClaimResponse {
  claimCode: string
  expiresAt: string
}

export interface DuplicateCandidateRecord {
  id: string
  patientId: string
  fullName: string
  age: number
  gender: string
  village: string
  mandal: string
  district: string
  phcId: string
  matchReason: string
}

export const fetchHospitals = async (filters?: {
  mandal?: string
  type?: string
}): Promise<HospitalRecord[]> => {
  const response = await api.get('/hospitals', {
    params: filters,
  })
  return (response.data.data?.hospitals ?? []) as HospitalRecord[]
}

export const fetchSpecialists = async (): Promise<SpecialistOption[]> => {
  const response = await api.get('/users/specialists')
  return (response.data.data?.specialists ?? []) as SpecialistOption[]
}

export const assignReferralSpecialist = async (
  referralId: string,
  specialistId: string,
  note?: string,
): Promise<void> => {
  await api.patch(`/referrals/${encodeURIComponent(referralId)}/specialist`, {
    specialistId,
    ...(note ? { note } : {}),
  })
}

export const updateReferralPriority = async (
  referralId: string,
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY',
): Promise<void> => {
  await api.patch(`/referrals/${encodeURIComponent(referralId)}/priority`, {
    priority,
  })
}

export const generateOwnershipClaim = async (
  patientId: string,
): Promise<OwnershipClaimResponse> => {
  const response = await api.post(
    `/patients/${encodeURIComponent(patientId)}/ownership-claims`,
    {},
  )
  return response.data.data as OwnershipClaimResponse
}

export const linkPatientAccount = async (
  patientId: string,
  claimToken: string,
): Promise<void> => {
  await api.post(`/patients/${encodeURIComponent(patientId)}/link-account`, {
    claimCode: claimToken.trim(),
  })
}

export const getDuplicateCandidatesFromError = (
  error: unknown,
): DuplicateCandidateRecord[] => {
  if (
    axios.isAxiosError<{
      data?: { possibleDuplicates?: DuplicateCandidateRecord[] }
    }>(error) &&
    error.response?.status === 409
  ) {
    return error.response.data?.data?.possibleDuplicates ?? []
  }
  return []
}

export const getPatientDiagnosticOrders = async (
  patientId: string,
): Promise<DiagnosticOrderRecord[]> => {
  const response = await api.get(
    `/diagnostics/patient/${encodeURIComponent(patientId)}`,
  )
  return response.data.data as DiagnosticOrderRecord[]
}

export const createDiagnosticOrder = async (order: {
  patientId: string
  screeningId?: string
  referralId?: string
  diagnosticType: DiagnosticOrderRecord['diagnosticType']
  clinicalReason: string
  facilityName?: string
  appointmentDate?: string
}): Promise<void> => {
  await api.post('/diagnostics', order)
}

export const updateDiagnosticOrderStatus = async (
  diagnosticId: string,
  update: {
    status: Exclude<DiagnosticStatus, 'ADVISED'>
    appointmentDate?: string
    reportReceivedAt?: string
    note?: string
  },
): Promise<void> => {
  await api.patch(
    `/diagnostics/${encodeURIComponent(diagnosticId)}/status`,
    update,
  )
}

export const recordDiagnosticResult = async (
  diagnosticId: string,
  resultText: string,
): Promise<void> => {
  await api.post(
    `/diagnostics/${encodeURIComponent(diagnosticId)}/result`,
    { resultText },
  )
}

export const getPatientFollowUps = async (
  patientId: string,
): Promise<FollowUpRecord[]> => {
  const response = await api.get(
    `/follow-ups/patient/${encodeURIComponent(patientId)}`,
  )
  return response.data.data as FollowUpRecord[]
}

export const createFollowUp = async (followUp: {
  patientId: string
  screeningId?: string
  referralId?: string
  assignedWorkerId: string
  dueAt: string
  note?: string
}): Promise<void> => {
  await api.post('/follow-ups', followUp)
}

export const updateFollowUp = async (
  followUpId: string,
  update: {
    status?: FollowUpRecord['status']
    dueAt?: string
    assignedWorkerId?: string
    visitNote?: string
    missedReason?: string
  },
): Promise<void> => {
  await api.patch(`/follow-ups/${encodeURIComponent(followUpId)}`, update)
}

export interface AppointmentRecord {
  _id: string
  appointmentId: string
  patientId: string
  doctorId:
    | string
    | {
        _id: string
        fullName: string
        specialization?: string
        role?: string
      }
  hospitalId: string
  referralId?: string
  appointmentType: 'NORMAL' | 'URGENT_EMERGENCY' | 'TELEMEDICINE'
  scheduledDate: string
  timeSlot: string
  status: 'REQUESTED' | 'CONFIRMED' | 'HOLD' | 'PAUSED' | 'REJECTED' | 'COMPLETED' | 'MISSED'
  meetingRoomId: string
  consultationNotes?: string
  prescription?: string
  nextAction?: 'DISCHARGE' | 'LOCAL_PHC_FOLLOWUP' | 'URGENT_BIOPSY_REFERRAL'
  urgentReason?: string
  patientName?: string
  doctorName?: string
  hospitalName?: string
}

export const fetchMyAppointments = async (
  patientId?: string,
): Promise<AppointmentRecord[]> => {
  const response = await api.get('/appointments/my-appointments', {
    params: patientId ? { patientId } : undefined,
  })
  return (response.data.data?.appointments ?? []) as AppointmentRecord[]
}

export const bookAppointment = async (input: {
  patientId: string
  doctorId: string
  hospitalId: string
  referralId?: string
  appointmentType?: 'NORMAL' | 'URGENT_EMERGENCY' | 'TELEMEDICINE'
  scheduledDate: string
  timeSlot: string
  urgentReason?: string
}): Promise<AppointmentRecord> => {
  const response = await api.post('/appointments/book', input)
  return response.data.data?.appointment as AppointmentRecord
}

export const concludeAppointment = async (
  id: string,
  input: {
    consultationNotes?: string
    prescription?: string
    nextAction?: 'DISCHARGE' | 'LOCAL_PHC_FOLLOWUP' | 'URGENT_BIOPSY_REFERRAL'
    status?: 'REQUESTED' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'MISSED'
  },
): Promise<AppointmentRecord> => {
  const response = await api.patch(
    `/appointments/${encodeURIComponent(id)}/conclude`,
    input,
  )
  return response.data.data?.appointment as AppointmentRecord
}

export const createClinicalReview = async (
  review: Record<string, unknown>,
): Promise<ClinicalReviewRecord> => {
  const response = await api.post('/clinical-reviews', review)
  return response.data.data as ClinicalReviewRecord
}

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export interface GrievanceRecord {
  _id?: string
  grievanceId: string
  patientId: string
  patientName: string
  mandal: string
  category:
    | 'TREATMENT_DELAY'
    | 'MEDICINE_SHORTAGE'
    | 'TRANSPORT_ISSUE'
    | 'STAFF_BEHAVIOR'
    | 'OTHER'
  description: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED'
  actionTaken?: string
  filedAt: string
}

export const fetchGrievances = async (): Promise<GrievanceRecord[]> => {
  const response = await api.get('/grievances')
  return (response.data.data ?? []) as GrievanceRecord[]
}

export const submitGrievance = async (input: {
  patientId: string
  patientName: string
  mandal: string
  category: GrievanceRecord['category']
  description: string
}): Promise<GrievanceRecord> => {
  const response = await api.post('/grievances', input)
  return response.data.data as GrievanceRecord
}

export const resolveGrievance = async (
  id: string,
  actionTaken: string,
): Promise<GrievanceRecord> => {
  const response = await api.patch(
    `/grievances/${encodeURIComponent(id)}/resolve`,
    { actionTaken },
  )
  return response.data.data as GrievanceRecord
}

export const getStoredUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem('aarogya_user')

  if (!storedUser) return null

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    logout()
    return null
  }
}
