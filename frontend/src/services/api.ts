import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://aarogya-drishti-9g70.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aarogya_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth & Roster
  getQuickLoginRoster: async () => {
    const res = await apiClient.post('/auth/patient-quick-login', {});
    return res.data;
  },

  patientQuickLogin: async (uidn: string) => {
    const res = await apiClient.post('/auth/patient-quick-login', { uidn });
    if (res.data.token) {
      localStorage.setItem('aarogya_token', res.data.token);
      localStorage.setItem('aarogya_patient', JSON.stringify(res.data.patient));
    }
    return res.data;
  },

  sendPhoneOtp: async (phone: string) => {
    const res = await apiClient.post('/auth/phone-otp', { phone });
    return res.data;
  },

  verifyPhoneOtp: async (phone: string, otp: string) => {
    const res = await apiClient.post('/auth/verify-otp', { phone, otp });
    if (res.data.token) {
      localStorage.setItem('aarogya_token', res.data.token);
    }
    return res.data;
  },

  registerPatient: async (patientData: any) => {
    const res = await apiClient.post('/auth/register-patient', patientData);
    if (res.data.token) {
      localStorage.setItem('aarogya_token', res.data.token);
    }
    return res.data;
  },

  aadharLogin: async (aadhar: string) => {
    const res = await apiClient.post('/auth/aadhar-login', { aadhar });
    if (res.data.token) {
      localStorage.setItem('aarogya_token', res.data.token);
      localStorage.setItem('aarogya_patient', JSON.stringify(res.data.patient));
    }
    return res.data;
  },

  doctorLogin: async (doctorId: string, password: string) => {
    const res = await apiClient.post('/auth/doctor-login', { doctorId, password });
    if (res.data.token) {
      localStorage.setItem('aarogya_doctor_token', res.data.token);
      localStorage.setItem('aarogya_doctor', JSON.stringify(res.data.doctor));
    }
    return res.data;
  },

  doctorResetPassword: async (doctorId: string, securityCode: string, newPassword: string) => {
    const res = await apiClient.post('/auth/doctor-reset-password', { doctorId, securityCode, newPassword });
    return res.data;
  },

  adminLogin: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/admin-login', { email, password });
    if (res.data.token) {
      localStorage.setItem('aarogya_admin_token', res.data.token);
      localStorage.setItem('aarogya_admin', JSON.stringify(res.data.admin));
    }
    return res.data;
  },

  // Screenings
  analyzeOralPhoto: async (formData: FormData) => {
    const res = await apiClient.post('/screenings/analyze-oral-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Cloudinary File & Asset Upload
  uploadToCloudinary: async (fileOrData: File | FormData | { imageBase64: string; patientUidn?: string; folder?: string }) => {
    if (fileOrData instanceof FormData) {
      const res = await apiClient.post('/upload/image', fileOrData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } else if (fileOrData instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrData);
      const res = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } else {
      const res = await apiClient.post('/upload/image', fileOrData);
      return res.data;
    }
  },

  getCloudinaryStatus: async () => {
    const res = await apiClient.get('/upload/status');
    return res.data;
  },

  getPatientScreenings: async (uidn: string) => {
    const res = await apiClient.get(`/screenings/patient/${uidn}`);
    return res.data;
  },

  getAllAppointments: async () => {
    const res = await apiClient.get('/appointments');
    return res.data;
  },

  getAllPrescriptions: async () => {
    const res = await apiClient.get('/prescriptions');
    return res.data;
  },

  getAllDoctors: async () => {
    const res = await apiClient.get('/admin/doctors');
    return res.data;
  },

  // Appointments
  getPatientAppointments: async (uidn: string) => {
    const res = await apiClient.get(`/appointments/patient/${uidn}`);
    return res.data;
  },

  requestAppointment: async (appointmentData: any) => {
    const res = await apiClient.post('/appointments/request', appointmentData);
    return res.data;
  },

  updateAppointmentStatus: async (id: string, status: string, doctorRemarks?: string) => {
    const res = await apiClient.put(`/appointments/${id}/status`, { status, doctorRemarks });
    return res.data;
  },

  // Prescriptions
  getPrescriptions: async (patientUidn: string) => {
    const res = await apiClient.get(`/prescriptions/${patientUidn}`);
    return res.data;
  },

  createPrescription: async (data: any) => {
    const res = await apiClient.post('/prescriptions/create', data);
    return res.data;
  },

  // Admin & Hospitals
  get11MandalsHospitals: async () => {
    const res = await apiClient.get('/admin/11-mandals-hospitals');
    return res.data;
  },

  createDoctor: async (doctorData: any) => {
    const res = await apiClient.post('/admin/doctors/create', doctorData);
    return res.data;
  },

  // Omnibar Search
  searchOmnibar: async (query: string) => {
    const res = await apiClient.get(`/search/omnibar?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  }
};

export default api;
