process.env.NODE_ENV = 'test';
import { startServer } from '../server.js';
import http from 'http';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number;
  success: boolean;
  summary: string;
}

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 RUNNING AAROGYA DRISHTI API ENGINE TEST SUITE');
  console.log('======================================================\n');

  // Boot server and await full listening + seed data readiness
  const server = await startServer();

  const PORT = Number(process.env.PORT) || 5000;
  const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

  const results: TestResult[] = [];

  const testEndpoint = async (
    name: string,
    path: string,
    method: 'GET' | 'POST' | 'PUT',
    body?: any,
    expectedStatus = 200
  ) => {
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {})
      };

      const res = await fetch(`${BASE_URL}${path}`, options);
      const data: any = await res.json().catch(() => ({}));

      const isSuccess = res.status === expectedStatus || (expectedStatus === 200 && res.status === 201);
      const summary = data.message || JSON.stringify(data).slice(0, 80);

      results.push({
        endpoint: `${method} ${path}`,
        method,
        status: res.status,
        expectedStatus,
        success: isSuccess,
        summary
      });

      console.log(`${isSuccess ? '✅' : '❌'} [${res.status}] ${method} ${path} -> ${summary}`);
      return data;
    } catch (err: any) {
      results.push({
        endpoint: `${method} ${path}`,
        method,
        status: 0,
        expectedStatus,
        success: false,
        summary: err.message
      });
      console.log(`❌ [FAILED] ${method} ${path} -> ${err.message}`);
      return null;
    }
  };

  // 1. Health check
  await testEndpoint('Health Check', '/health', 'GET');

  // 2. Patient Quick Login Roster
  await testEndpoint('Patient Quick Login Roster', '/auth/patient-quick-login', 'POST', {});

  // 3. Quick Login as K. Somanna
  const somannaLogin = await testEndpoint(
    'Quick Login K. Somanna',
    '/auth/patient-quick-login',
    'POST',
    { uidn: 'UIDN-ASR-2026-0001' }
  );

  // 4. Send Phone OTP
  await testEndpoint('Send Phone OTP', '/auth/phone-otp', 'POST', { phone: '9490123451' });

  // 5. Verify Phone OTP
  await testEndpoint('Verify Phone OTP', '/auth/verify-otp', 'POST', {
    phone: '9490123451',
    otp: '123456'
  });

  // 6. Register Patient (auto-age & auto-UIDN)
  await testEndpoint('Register Patient', '/auth/register-patient', 'POST', {
    name: 'G. Appa Rao',
    dob: '1984-06-15',
    gender: 'MALE',
    bloodGroup: 'B+',
    phone: '9490123499',
    aadhar: '4567-8901-2345',
    mandal: 'Hukumpeta',
    village: 'Bakuru',
    habitation: 'Hukumpeta Hills'
  }, 201);

  // 7. Screening AI Analysis (>90% accuracy demonstration)
  await testEndpoint(
    'Analyze Oral Photo AI',
    '/screenings/analyze-oral-photo',
    'POST',
    {
      patientUidn: 'UIDN-ASR-2026-0001',
      oralRegion: 'Right Buccal Mucosa',
      symptomsChecklist: [
        'Persistent white patch',
        'Burning sensation',
        'Rough mucosal border'
      ],
      habitExposure: {
        tobacco: true,
        reverseSmoking: true,
        areca: true,
        years: 18,
        frequency: '6-8 times daily'
      }
    }
  );

  // 8. Patient Appointments
  await testEndpoint(
    'Get Patient Appointments',
    '/appointments/patient/UIDN-ASR-2026-0001',
    'GET'
  );

  // 9. Request Appointment
  await testEndpoint('Request Appointment', '/appointments/request', 'POST', {
    patientUidn: 'UIDN-ASR-2026-0001',
    mandal: 'G. Madugula',
    hospitalName: 'Community Health Centre G. Madugula',
    apptType: 'Biopsy Procedure Appointment',
    appointmentDate: '2026-11-20T10:00:00Z',
    doctorRemarks: 'Follow-up punch biopsy review'
  }, 201);

  // 10. Update Appointment Status (Doctor Approve/Reject)
  await testEndpoint(
    'Update Appointment Status',
    '/appointments/APT-ASR-2026-0001/status',
    'PUT',
    {
      status: 'APPROVED',
      doctorRemarks: 'Confirmed by Dr. S. Rao for punch biopsy'
    }
  );

  // 11. Prescriptions by Patient
  await testEndpoint(
    'Get Prescriptions',
    '/prescriptions/UIDN-ASR-2026-0001',
    'GET'
  );

  // 12. Create Prescription
  await testEndpoint('Create Prescription', '/prescriptions/create', 'POST', {
    patientUidn: 'UIDN-ASR-2026-0001',
    doctorUidn: 'DOC-ASR-2026-001',
    medicines: [
      {
        name: 'Lycopene 8mg + Beta-Carotene Softgels',
        dosage: '1 capsule',
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'After food'
      }
    ],
    biopsyRecommended: true,
    trackingStatus: 'Biopsy Scheduled',
    clinicalNotes: 'Pre-biopsy anti-inflammatory regimen'
  }, 201);

  // 13. Admin 11 Mandals Hospitals
  await testEndpoint(
    '11 Mandals Hospitals Grid',
    '/admin/11-mandals-hospitals',
    'GET'
  );

  // 14. Admin Create Doctor
  await testEndpoint('Admin Create Doctor', '/admin/doctors/create', 'POST', {
    name: 'Dr. T. Venkata Ramana, MDS',
    degreeCertificate: 'MDS Oral Pathology - AMC (2018)',
    university: 'Andhra Medical College',
    passingYear: 2018,
    experienceYears: 8,
    designation: 'Oral Onco-Diagnostic Specialist',
    hospitalDuty: 'Community Health Centre Chintapalle',
    abdmCode: 'ABDM-DOC-AP-5561',
    email: 'dr.ramana@aarogyadrishti.org',
    phone: '9848011244',
    credentials: ['Oral Biopsy Specialist', 'Tobacco Cessation Consultant']
  }, 201);

  // 15. Universal Omnibar Search
  await testEndpoint('Omnibar Search Somanna', '/search/omnibar?q=Somanna', 'GET');
  await testEndpoint('Omnibar Search Paderu', '/search/omnibar?q=Paderu', 'GET');

  // Summary
  const passed = results.filter((r) => r.success).length;
  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed}/${results.length} PASSED`);
  console.log('======================================================\n');

  server.close(() => {
    if (passed === results.length) {
      console.log('🎉 ALL REST API ENDPOINTS RETURN 200 OK / 201 CREATED!');
      process.exit(0);
    } else {
      console.error('❌ Some tests failed.');
      process.exit(1);
    }
  });
};

runTests();
