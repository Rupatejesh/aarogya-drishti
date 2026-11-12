# AAROGYA DRISHTI — Testing and Demo Plan

**Project:** AAROGYA DRISHTI  
**Project Type:** AI-Assisted Oral Cancer Early-Screening and Patient-Care Platform  
**Technology Stack:** MongoDB Community Edition, Express.js, Node.js, React, Vite, TypeScript  
**Frontend:** React + Vite + TypeScript  
**Backend:** Node.js + Express.js  
**Database:** MongoDB + Mongoose  
**Routing:** React Router  
**HTTP Client:** Axios  
**Languages:** Telugu and English  
**Document Status:** Testing and Demonstration Plan  
**Version:** 1.0

---

## 1. Purpose of This Document

This document defines the testing strategy, test scenarios, demo workflow, acceptance criteria, and final evaluation preparation for AAROGYA DRISHTI.

The objective is to ensure that the application is not merely a visual prototype. It must demonstrate functional frontend and backend integration, persistent database operations, role-based access, patient workflows, offline functionality, and reliable error handling.

This document describes the tests that must be performed during development and before the hackathon demonstration.

**Important:** A test is not considered passed until it has actually been executed and its result recorded.

### Phase 2 backend verification snapshot

From the `server` directory, run `npm test`; the suite uses Node's test runner with model/database mocks and does not connect to MongoDB. Backend TypeScript and production-build checks are `npm run typecheck` and `npm run build`. From `client`, run `npm run lint` and `npm run build`. Backend lint is not configured.

The backend unit suite covers patient ID and registration validation, duplicate-warning behavior, registration concurrency, consent grant/withdrawal concurrency, screening versus consent-withdrawal concurrency, role and patient scopes, mounted Express route authorization using mocked user lookup, session cookies/CSRF/revocation, in-person ownership claims and path binding, referral creation, diagnostic result recording, follow-up scheduling, aggregate geography/suppression, and existing screening/review workflows. These tests do not verify database lock/transaction behavior, browser interactions, or real API-to-database integration. Do not treat the aspirational scenarios below as completed tests unless separately executed and recorded.

### Isolated MongoDB integration verification

The separate real-database suite is run from `server` with `npm run test:integration`. It requires `MONGO_TEST_URI` to be set in the process environment; the test runner does not load `.env` or use `MONGO_URI` as a fallback. It parses the URI and refuses to connect unless the database path is exactly `aarogya_drishti_test`. The suite prints the database name, topology, and exact synthetic record IDs; URI contents are not printed.

Example PowerShell setup for a local test-only MongoDB:

```powershell
$env:MONGO_TEST_URI = "mongodb://127.0.0.1:27017/aarogya_drishti_test"
Set-Location .\server
npm run test:integration
```

Use only a dedicated test MongoDB deployment. The suite creates clearly synthetic records, tracks and prints their exact MongoDB IDs, and disconnects. It does not delete records, drop a database, or clear collections. The standalone rollback assertion is skipped because it would require deleting a synthetic patient record; it must not be enabled without explicit cleanup approval. Configure the environment variable outside the project `.env` file.

Latest Phase 2 verification in the current task: backend unit tests **47 passed / 0 failed**; backend TypeScript check **passed**; backend production build **passed**; frontend ESLint **passed**; frontend TypeScript check and production bundle **passed**. Dedicated database integration tests were **not run** because `MONGO_TEST_URI` was not configured; no database connection was attempted and no test record IDs were created. No live HTTP/API or browser/E2E test was executed. Real transaction/lock behavior, real API integration, browser workflows, deployment configuration, and accessibility remain unverified.

## 2. Testing Objectives

The main testing objectives are:

1. Verify patient registration and unique Patient ID generation.
2. Verify patient records and screening history are stored persistently in MongoDB.
3. Verify health-worker screening workflows.
4. Verify image upload, preview, quality checks, and secure image handling.
5. Verify that AI demonstration results are clearly separated from clinical decisions.
6. Verify Medical Officer and Specialist review workflows.
7. Verify appointment booking, referrals, and diagnostic tracking.
8. Verify telemedicine session functionality.
9. Verify Telugu and English language switching.
10. Verify offline data capture and safe synchronization.
11. Verify role-based permissions and protected APIs.
12. Verify patient history, audit logs, and district-level aggregate reporting.
13. Verify SAMMAKKA application assistant functionality.
14. Verify the application on desktop and budget Android-sized screens.

## 3. Testing Environment

### 3.1 Required Development Environment

| Component | Technology |
|---|---|
| Operating System | Windows 10 / Windows 11 |
| Code Editor | Visual Studio Code |
| Runtime | Node.js |
| Package Manager | npm |
| Backend | Express.js |
| Frontend | React + Vite + TypeScript |
| Database | MongoDB Community Edition |
| ODM | Mongoose |
| API Testing | Postman or equivalent |
| Browser Testing | Chrome and Edge |
| Version Control | Git |
| Frontend Testing | Vitest and React Testing Library |
| Backend Testing | Node.js-compatible test tools such as Vitest or Jest |
| API Testing | Supertest or equivalent |

The final testing environment should also include an Android device or mobile browser with a small-screen viewport.

### 3.2 Environment Separation

Maintain separate configurations for:

- Development
- Testing
- Hackathon demonstration

Do not use real patient information in any of these environments.

### 3.3 Synthetic Test Data

All hackathon testing must use synthetic patients, demonstration users, fictional facilities, and licensed educational or demonstration images.

Never use actual patient records, patient photographs, or clinical consultation recordings in the hackathon demo.

## 4. Testing Strategy

Testing will be performed in multiple stages.

### 4.1 Unit Testing

Test individual functions and components independently.

Examples:

- Patient ID generation.
- Form validation.
- Input sanitization.
- Role and permission checks.
- Date and appointment validation.
- Screening status calculations.
- Offline synchronization state handling.
- Telugu and English translation selection.
- Dashboard metric calculations.

### 4.2 Integration Testing

Test communication between application components.

Examples:

- React frontend to Express API.
- Express API to MongoDB through Mongoose.
- Authentication middleware to protected routes.
- Patient registration to patient history.
- Screening record to image metadata.
- AI demonstration adapter to screening workflow.
- Appointment booking to notification workflow.
- Referral creation to patient timeline.
- Offline queue to synchronization API.

### 4.3 End-to-End Testing

Test complete workflows from the user's perspective.

Examples:

- Health Worker registers a synthetic patient.
- Health Worker captures a demonstration image.
- Screening record is submitted.
- Medical Officer reviews the record.
- Specialist appointment is booked.
- Simulated diagnostic result is recorded by an authorized clinician.
- Patient history displays the completed workflow.

### 4.4 Security Testing

Verify that users can access only the information and actions permitted by their roles.

Test:

- Authentication.
- Authorization.
- Session expiration.
- Password handling.
- Input validation.
- Unauthorized API access.
- Patient record access restrictions.
- Image and document access restrictions.
- Audit logging.
- Export permissions.
- Offline data protection.

### 4.5 Usability and Accessibility Testing

Verify:

- Large touch-friendly buttons.
- Readable Telugu and English text.
- Clear navigation.
- Simple forms.
- Meaningful error messages.
- Mobile responsiveness.
- Keyboard accessibility.
- Appropriate contrast.
- Understandable icons and labels.

## 5. User Roles for Testing

Create synthetic accounts for all seven user categories.

| User Role | Main Testing Responsibilities |
|---|---|
| Patient | View permitted personal information, appointments, and notifications |
| ASHA / Health Worker | Register patients, record screening information, and capture images |
| Medical Officer | Review screening records, enter clinical observations, and create referrals |
| Specialist | Review referred cases, document specialist assessment, and request investigations |
| District Officer | View aggregate district reports and programme indicators |
| ITDA Project Officer | View aggregate programme implementation indicators, separately scoped from clinical access |
| Administrator | Manage authorized users, facilities, roles, and system configuration |

The backend unit suite uses Node's test runner with `tsx`; its role tests include mounted Express route checks with a mocked user lookup and no database connection. Run it from `server/` using `npm test`. Mocked tests do not connect to, alter, or delete the development database.

### 5.1 Role-Based Testing Principles

- Every account must have its own credentials.
- Shared accounts must not be used.
- Users must not gain additional permissions by changing frontend state.
- Backend APIs must enforce authorization independently.
- Patient information must be accessible only through authorized care relationships and permissions.
- District-level users should see aggregate data by default.
- Access to identifiable patient records must require explicit authorization and be audited.
- Administrator access must not automatically mean unrestricted clinical access.

## 6. Functional Testing

### 6.1 Authentication and User Management

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| AUTH-001 | Login with valid credentials | User successfully logs in |
| AUTH-002 | Login with incorrect password | Clear error message is displayed |
| AUTH-003 | Submit empty login form | Required-field validation appears |
| AUTH-004 | Access protected page without login | Access is denied or user is redirected |
| AUTH-005 | Login with different user roles | Correct role and permissions are loaded |
| AUTH-006 | Logout | Session is invalidated |
| AUTH-007 | Access expired session | User must authenticate again |
| AUTH-008 | Attempt unauthorized role action | Backend rejects the request |
| AUTH-009 | Privileged account authentication | Configured additional authentication is enforced |

### 6.2 Patient Registration

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| PAT-001 | Register a new synthetic patient | Patient record is created |
| PAT-002 | Generate Patient ID | Unique Patient ID is generated |
| PAT-003 | Submit missing required fields | Validation prevents invalid submission |
| PAT-004 | Enter duplicate patient details | Possible duplicate is flagged |
| PAT-005 | Enter village and PHC information | Location information is saved correctly |
| PAT-006 | Enter tobacco and exposure history | History is saved |
| PAT-007 | Enter symptoms and duration | Information is saved without making an automated diagnosis |
| PAT-008 | Record consent | Consent status and timestamp are saved |
| PAT-009 | Register without Aadhaar | Registration remains possible |
| PAT-010 | Open saved patient record | Correct information is displayed according to permissions |

### 6.3 Oral Screening

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| SCR-001 | Start a new screening | Screening form opens |
| SCR-002 | Select examination site | Correct site is recorded |
| SCR-003 | Capture a demonstration image | Image preview is displayed |
| SCR-004 | Retake an image | New image replaces the selected image |
| SCR-005 | Submit incomplete screening | Required-field validation appears |
| SCR-006 | Save screening record | Record is stored and linked to the patient |
| SCR-007 | Open screening history | Previous screenings are displayed |
| SCR-008 | Add clinical observations | Observations are saved separately from AI output |
| SCR-009 | Attempt to access another patient's image without permission | Access is denied |

Supported guided examination locations should include:

- Tongue.
- Inner cheeks.
- Palate.
- Gums.
- Floor of the mouth.

Photographs supplement the full clinical examination and do not replace it.

### 6.4 Image Quality Testing

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| IMG-001 | Upload an acceptable demonstration image | Image is accepted for the next workflow step |
| IMG-002 | Submit a blurred image | Poor-quality warning is displayed |
| IMG-003 | Submit a very dark image | Lighting warning is displayed |
| IMG-004 | Submit an image with excessive glare | Image quality warning is displayed |
| IMG-005 | Submit an unsupported file type | Upload is rejected |
| IMG-006 | Submit an oversized file | Configured file-size validation is applied |
| IMG-007 | Preview an image before submission | Correct preview is displayed |
| IMG-008 | Recapture an image | Updated image is associated with the screening |
| IMG-009 | Attempt unauthorized image access | Access is denied |

The image-quality workflow must distinguish technical image quality from clinical interpretation.

A good-quality image does not establish that a patient is healthy.

### 6.5 AI-Assisted Demonstration Testing

The hackathon version may use a mock or demonstration inference adapter.

It must never represent mock output as a validated medical diagnosis.

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| AI-001 | Submit a demonstration image to the AI adapter | A structured demonstration result is returned |
| AI-002 | Submit an image with insufficient quality | Result indicates insufficient image quality |
| AI-003 | Demonstrate a suspicious-finding state | Result requests qualified clinical review |
| AI-004 | Demonstrate no suspicious finding identified | Disclaimer remains visible |
| AI-005 | Open AI result history | Previous results and versions are retained |
| AI-006 | Medical Officer disagrees with advisory output | Clinical decision is recorded separately |
| AI-007 | Medical Officer defers a decision | Deferred status is saved |
| AI-008 | Review AI model information | Model name, version, provenance, and limitations are displayed |
| AI-009 | Inspect AI result and signed clinical conclusion | The two are clearly distinguishable |

Allowed demonstration result labels:

1. Image insufficient for demonstration assessment.
2. Suspicious finding indicated by demonstration model — clinical review required.
3. No suspicious finding identified by demonstration model — does not rule out disease.

**Mandatory AI disclaimer:**

> NOT FOR CLINICAL USE. Demonstration or research output only. This result is not a diagnosis and must not be used to make treatment decisions.

The AI demonstration must not:

- Diagnose oral cancer.
- Assign cancer stages.
- Confirm or exclude malignancy.
- Replace a Medical Officer or Specialist.
- Recommend treatment based solely on an image.
- Reassure a patient that no disease is present.

### 6.6 Medical Officer Portal

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| MO-001 | Open assigned review queue | Authorized cases are displayed |
| MO-002 | Open a screening record | Relevant history and images are available |
| MO-003 | View AI demonstration result | Advisory result and disclaimer are visible |
| MO-004 | Enter clinical observations | Observations are saved |
| MO-005 | Agree with advisory output | Decision is recorded |
| MO-006 | Disagree with advisory output | Override and reason are recorded |
| MO-007 | Defer review | Case status is updated |
| MO-008 | Request image recapture | Recapture request is recorded |
| MO-009 | Create specialist referral | Referral record is created |
| MO-010 | Sign clinical note | Authorized clinician and timestamp are recorded |

### 6.7 Specialist Portal

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| SP-001 | Open specialist referral queue | Authorized referrals are displayed |
| SP-002 | Open referred patient history | Permitted longitudinal information is displayed |
| SP-003 | Add specialist assessment | Assessment is saved |
| SP-004 | Request further examination | Request is recorded |
| SP-005 | Recommend biopsy or another investigation | Investigation order is created |
| SP-006 | Add specialist follow-up plan | Follow-up information is saved |
| SP-007 | Access a case outside assigned permissions | Access is denied |

### 6.8 Appointment and Referral Management

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| REF-001 | Create a specialist referral | Referral is saved |
| REF-002 | Select a referral facility | Correct facility is associated |
| REF-003 | Book an available appointment | Booking is created |
| REF-004 | Select an unavailable slot | Booking is rejected |
| REF-005 | Reschedule an appointment | New appointment time is saved |
| REF-006 | Cancel an appointment | Cancellation status is recorded |
| REF-007 | Record attendance | Attendance status is updated |
| REF-008 | Record a missed appointment | Missed status and reason can be recorded |
| REF-009 | Generate referral slip | Telugu or English slip is available |
| REF-010 | Send appointment reminder | Non-sensitive notification is generated |

### 6.9 Telemedicine

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| TEL-001 | Create a specialist consultation request | Request is saved |
| TEL-002 | Book a consultation slot | Consultation is scheduled |
| TEL-003 | Open an authorized meeting link | Authorized participants can join |
| TEL-004 | Test microphone | Audio works |
| TEL-005 | Test camera | Video works |
| TEL-006 | Attempt access after link expiry | Access is denied |
| TEL-007 | Record consultation notes | Notes are stored securely |
| TEL-008 | End consultation | Session status is updated |
| TEL-009 | Verify recording setting | Recording is disabled by default |

The hackathon demo must use fictional participants and a demonstration session.

A production deployment requires an appropriately reviewed telemedicine provider, security controls, consent procedures, and applicable legal and regulatory compliance.

### 6.10 Diagnostics and Treatment Tracking

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| DIA-001 | Create biopsy investigation order | Authorized order is saved |
| DIA-002 | Mark investigation as scheduled | Status changes correctly |
| DIA-003 | Mark sample as collected | Sample collection status is saved |
| DIA-004 | Mark pathology report as pending | Pending status is displayed |
| DIA-005 | Upload simulated pathology report | Document metadata is linked securely |
| DIA-006 | Record report received | Status is updated |
| DIA-007 | Record clinician review | Reviewing clinician and timestamp are saved |
| DIA-008 | Record simulated clinical result | Authorized clinician enters the result |
| DIA-009 | Record treatment linkage | Follow-up information is updated |

The application must distinguish:

- Screening-positive or suspicious screening result.
- Clinical suspicion.
- Clinician-confirmed precancer.
- Pathology-confirmed malignancy.

A photograph or AI flag must never be treated as a substitute for biopsy and pathology confirmation when those investigations are clinically indicated.

### 6.11 Patient Record and Audit History

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| REC-001 | Open a patient timeline | Authorized history is displayed |
| REC-002 | View previous screening | Correct screening history appears |
| REC-003 | View referral history | Referral events appear |
| REC-004 | View diagnostic history | Investigation events appear |
| REC-005 | View clinical notes | Authorized notes are displayed |
| REC-006 | Update a patient record | Change is recorded |
| REC-007 | Review audit history | User and timestamp are recorded |
| REC-008 | Attempt unauthorized record modification | Request is rejected |
| REC-009 | Review AI version history | Previous AI results remain traceable |

### 6.12 District Officer Dashboard

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| DST-001 | Open district dashboard | Aggregate indicators are displayed |
| DST-002 | Filter by mandal | Correct aggregate data is shown |
| DST-003 | Filter by PHC | Correct aggregate data is shown |
| DST-004 | Filter by village | Correct aggregate data is shown |
| DST-005 | View screening totals | Counts match underlying authorized aggregate data |
| DST-006 | View referrals | Referral counts are displayed |
| DST-007 | View overdue cases | Overdue aggregate count is displayed |
| DST-008 | View diagnostic status | Pending and completed counts are displayed |
| DST-009 | Export aggregate report | Authorized report is generated |
| DST-010 | Attempt unauthorized patient-level access | Access is denied |

Dashboard indicators should include:

- Registered patients.
- Screenings completed.
- Medical Officer reviews completed.
- Suspicious findings requiring clinical review.
- Specialist referrals.
- Completed appointments.
- Overdue appointments.
- Biopsies advised.
- Biopsies completed.
- Pathology reports pending.
- Pathology reports received.
- Clinician-confirmed precancers and cancers.
- Treatment linkage.
- Loss to follow-up.
- Average time to review.
- Average time to diagnosis, where the necessary timestamps are available.

Staff workload and activity summaries may also be included.

All dashboard figures must be derived from actual synthetic records in the demonstration database. Do not use invented numbers that appear to represent real programme activity.

### 6.13 SAMMAKKA Assistant

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| SAM-001 | Open floating assistant button | SAMMAKKA panel opens |
| SAM-002 | Ask how to register a patient | Registration guidance is displayed |
| SAM-003 | Ask how to capture a screening photo | Image workflow guidance is displayed |
| SAM-004 | Ask how to switch languages | Telugu/English switching instructions appear |
| SAM-005 | Ask how to book an appointment | Appointment guidance is displayed |
| SAM-006 | Ask how to access a referral | Referral guidance is displayed |
| SAM-007 | Ask an unsupported application question | Assistant provides a safe fallback |
| SAM-008 | Ask for a medical diagnosis | Assistant directs the user to a qualified professional |
| SAM-009 | Switch language to Telugu | Supported guidance appears in Telugu |
| SAM-010 | Open assistant on another page | Floating assistant remains available |

SAMMAKKA is an application-use assistant, not a medical professional.

It must not diagnose symptoms, interpret photographs as a doctor, or recommend treatment.

## 7. Offline and Synchronization Testing

Offline operation is a critical feature for field health workers.

### 7.1 Offline Test Scenarios

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| OFF-001 | Open application while connected | Application loads normally |
| OFF-002 | Disconnect internet | Offline state is indicated |
| OFF-003 | Register a synthetic patient offline | Permitted offline record is saved locally |
| OFF-004 | Save a screening draft offline | Draft is retained |
| OFF-005 | Capture a permitted demonstration image offline | Image is stored according to local protection rules |
| OFF-006 | Reconnect internet | Synchronization becomes available |
| OFF-007 | Synchronize pending records | Records are submitted safely |
| OFF-008 | Interrupt synchronization | Pending records are not silently lost |
| OFF-009 | Repeat a synchronization request | Duplicate records are prevented through idempotency |
| OFF-010 | Simulate conflicting record updates | Conflict is identified and handled safely |
| OFF-011 | Review synchronization status | Pending, successful, and failed states are visible |
| OFF-012 | Logout or change account | Locally cached data remains protected |

### 7.2 Offline Storage Requirements

- Use IndexedDB for appropriate offline records.
- Do not treat IndexedDB alone as encryption.
- Apply appropriate protection to sensitive offline data and media.
- Avoid storing passwords or long-lived access tokens in insecure browser storage.
- Keep synchronization metadata, including record identifiers and status.
- Use retry handling for temporary network failures.
- Prevent duplicate submissions.
- Restrict locally cached patient information by user and session.
- Define safe logout and local-data-clearing behavior.

### 7.3 Synchronization Statuses

Suggested statuses:

- Pending.
- Syncing.
- Synced.
- Failed.
- Conflict requiring review.

A failed synchronization must not silently mark a record as synchronized.

## 8. Security and Privacy Testing

Security tests must be executed against both frontend workflows and backend APIs.

| Test ID | Security Test | Expected Result |
|---|---|---|
| SEC-001 | Access protected API without authentication | Rejected |
| SEC-002 | Access another role's restricted endpoint | Rejected |
| SEC-003 | Modify role information from frontend | Backend permissions remain enforced |
| SEC-004 | Submit invalid input | Validation rejects unsafe data |
| SEC-005 | Attempt unauthorized patient access | Rejected |
| SEC-006 | Attempt unauthorized image access | Rejected |
| SEC-007 | Check sensitive data in application logs | Sensitive information is not exposed |
| SEC-008 | Check frontend source for secrets | No backend secrets are exposed |
| SEC-009 | Check database connection configuration | Credentials are stored outside source code |
| SEC-010 | Check secure transport configuration | HTTPS is required for deployed environments |
| SEC-011 | Attempt unauthorized bulk export | Rejected and recorded where applicable |
| SEC-012 | Review audit log | Important actions are traceable |
| SEC-013 | Verify privileged account controls | Configured stronger authentication is applied |
| SEC-014 | Verify backup and recovery procedure | Demonstration data can be restored |

Additional requirements:

1. Use environment variables for secrets.
2. Never commit `.env` files containing credentials.
3. Use least-privilege database accounts.
4. Store passwords using an appropriate password-hashing algorithm.
5. Use secure session and token handling.
6. Protect patient images and documents from public access.
7. Apply authorization checks on every sensitive backend endpoint.
8. Record access to sensitive records and material changes.
9. Avoid exposing sensitive information in notifications.
10. Use synthetic data in the hackathon environment.

A successful demonstration security test does not constitute independent production security certification.

## 9. Telugu and English Testing

Both Telugu and English are mandatory for essential workflows.

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| LAN-001 | Open application in English | English interface appears |
| LAN-002 | Switch to Telugu | Telugu interface appears |
| LAN-003 | Register a synthetic patient in Telugu | Registration works |
| LAN-004 | Navigate screening workflow in Telugu | Labels and guidance are translated |
| LAN-005 | View appointment information in Telugu | Appointment details are understandable |
| LAN-006 | Display validation error in Telugu | Appropriate Telugu error appears |
| LAN-007 | Switch back to English | English interface is restored |
| LAN-008 | Reload application after language selection | Expected language preference is retained |

Check:

- Text overflow.
- Font rendering.
- Button labels.
- Form labels.
- Error messages.
- Date and number presentation.
- SAMMAKKA responses.
- Referral slips.
- Appointment notifications.

Hindi may be considered as a future enhancement. It does not replace Telugu and English support.

## 10. Performance and Reliability Testing

Test the application under realistic hackathon demonstration conditions.

### 10.1 Performance Tests

- Initial application loading.
- Login response.
- Patient registration response.
- Patient history loading.
- Screening image upload.
- Review queue loading.
- Dashboard filtering.
- Aggregate report generation.
- Offline synchronization.

Record actual response times and test conditions. Do not report estimated values as measured results.

### 10.2 Reliability Tests

| Test ID | Scenario | Expected Result |
|---|---|---|
| REL-001 | MongoDB service unavailable | Application displays a useful error |
| REL-002 | Backend server unavailable | Frontend handles the failure gracefully |
| REL-003 | Network interruption during submission | User is informed and data is not silently lost |
| REL-004 | Refresh page during normal navigation | Application recovers correctly |
| REL-005 | Invalid API response | Frontend handles the error safely |
| REL-006 | Database restart | Application reconnects or reports the failure appropriately |
| REL-007 | Repeat form submission | Duplicate creation is prevented where required |

### 10.3 Responsive Testing

Test the interface at:

- Desktop browser.
- Laptop browser.
- Tablet viewport.
- Budget Android-sized mobile viewport.

Check that:

- Navigation remains usable.
- Forms fit the screen.
- Buttons are touch-friendly.
- Images display correctly.
- Tables and charts remain readable.
- SAMMAKKA does not block essential controls.

## 11. Special Jury Evaluation Scenarios

The following scenarios should be demonstrated deliberately because they test important requirements beyond the normal happy path.

### Scenario 1: Telugu Patient Registration

- Login as Health Worker.
- Switch to Telugu.
- Register the compulsory synthetic patient.
- Enter fictional location and exposure history.
- Record consent.
- Generate a Patient ID.
- Verify the record is saved.

**Expected:** Complete registration workflow works in Telugu.

### Scenario 2: Offline Registration and Synchronization

- Disconnect the network.
- Register a synthetic patient.
- Save a screening draft.
- Confirm offline status.
- Reconnect the network.
- Synchronize the pending record.
- Verify the record appears in the backend and patient timeline.

**Expected:** Offline work is retained and synchronized safely.

### Scenario 3: Poor Image Quality

- Submit a licensed demonstration image with poor quality.
- Run the image-quality workflow.
- Display the warning.
- Request recapture.

**Expected:** The system does not silently treat a poor-quality image as suitable for assessment.

### Scenario 4: AI and Clinical Decision Separation

- Submit a demonstration image.
- Show the clearly labelled demonstration result.
- Login as Medical Officer.
- Review the result.
- Record agreement, disagreement, or deferment.
- Display the signed clinical conclusion separately.

**Expected:** AI output is advisory and never replaces clinical responsibility.

### Scenario 5: Unauthorized Access

- Login using a restricted user role.
- Attempt to access an unauthorized patient record or API.
- Show the rejected request.
- Review the relevant audit event where configured.

**Expected:** Backend authorization prevents unauthorized access.

### Scenario 6: Missed Appointment

- Create a synthetic appointment.
- Mark it as missed.
- Record the reason.
- Show the overdue follow-up queue.
- Assign a navigator task.

**Expected:** Missed appointments remain visible for follow-up.

### Scenario 7: Network Failure and Recovery

- Start an allowed demonstration workflow.
- Disconnect the network.
- Show the failure message and retained pending state.
- Restore the network.
- Retry synchronization.

**Expected:** The application recovers without silently losing or duplicating data.

### Scenario 8: Doctor Override

- Display an AI demonstration advisory.
- Medical Officer records a different clinical decision.
- Enter the reason.
- Save the review.
- Show both records in history.

**Expected:** Clinician judgment remains independent and traceable.

## 12. Compulsory Hackathon Demonstration Workflow

The main demonstration must follow the official problem statement's synthetic patient scenario.

### 12.1 Demonstration Patient

Use the following fictional patient profile:

| Field | Demonstration Value |
|---|---|
| Patient Age | 46 years |
| Location | G. Madugula |
| History | Fictional tobacco-chewing history |
| Finding | Fictional persistent white cheek patch |
| Data Type | Synthetic demonstration data |
| Consent | Demonstration consent record |

The demonstration must not use an actual patient.

### 12.2 End-to-End Demonstration Steps

**Step 1 — Login**

- Open the application.
- Login using the Health Worker demonstration account.
- Display the Health Worker dashboard.
- Open SAMMAKKA.

**Step 2 — Telugu Registration**

- Switch to Telugu.
- Register the synthetic 46-year-old patient.
- Enter the fictional location.
- Record the fictional tobacco-chewing history.
- Record the fictional persistent white cheek patch.
- Record demonstration consent.
- Generate the Patient ID.

**Step 3 — Oral Screening**

- Start a screening record.
- Select the inner cheek examination site.
- Upload or capture a licensed educational demonstration image.
- Show image preview.
- Demonstrate image-quality feedback.
- Save the screening record.

**Step 4 — AI Demonstration**

- Submit the demonstration image to the mock AI adapter.
- Display its structured illustrative result.
- Display the NOT FOR CLINICAL USE warning.
- Explain that the result is not a diagnosis.

**Step 5 — Medical Officer Review**

- Login as Medical Officer.
- Open the review queue.
- Open the synthetic patient's screening record.
- Review the image and history.
- View the AI advisory separately.
- Enter a fictional clinical review note.
- Record a decision requiring specialist assessment, if appropriate for the demonstration scenario.

**Step 6 — Specialist Referral**

- Create a referral.
- Select a fictional specialist facility.
- Record the referral reason.
- Save the referral.
- Generate the referral slip in Telugu or English.

**Step 7 — Telemedicine Consultation**

- Login using the Specialist demonstration account.
- Open the consultation request.
- Book a demonstration time slot.
- Open the secure demonstration meeting.
- Verify audio and video.
- Enter fictional consultation notes.
- End the session.

**Step 8 — Biopsy and Diagnostic Tracking**

- Record a specialist-directed simulated biopsy order.
- Update investigation status.
- Mark the fictional sample as collected.
- Upload a simulated pathology report.
- Mark the report as received.
- Login as the authorized clinician.
- Enter the fictional result and review note.

**Important:** The simulated report must be visibly labelled as fictional. It must not be represented as a real pathology result or a clinically validated conclusion.

**Step 9 — Patient Longitudinal Record**

Open the patient's timeline and show:

- Registration.
- Consent.
- Screening record.
- Image metadata.
- AI demonstration history.
- Medical Officer review.
- Specialist referral.
- Telemedicine consultation.
- Investigation order.
- Simulated report.
- Authorized clinician entry.
- Follow-up action.

**Step 10 — Navigator Follow-up**

- Assign a fictional follow-up task.
- Demonstrate a reminder.
- Show how missed appointments are tracked.

**Step 11 — District Dashboard**

Login as District Officer.

Show aggregate indicators:

- Registered patients.
- Screenings.
- Medical Officer reviews.
- Referrals.
- Appointments.
- Overdue cases.
- Biopsies advised and completed.
- Pathology pending and received.
- Follow-up status.

Apply village, mandal, or PHC filters.

**Step 12 — Security Demonstration**

- Show role-based access.
- Attempt one unauthorized action.
- Display the rejection.
- Show relevant audit history.

**Step 13 — SAMMAKKA Demonstration**

- Open SAMMAKKA on another application page.
- Ask how to complete a common application task.
- Switch between Telugu and English.
- Demonstrate safe redirection for medical questions.

## 13. Five-Minute Product Demonstration Plan

| Time | Demonstration |
|---|---|
| 0:00–0:30 | Problem, solution, and application overview |
| 0:30–1:15 | Telugu patient registration |
| 1:15–2:00 | Screening, image quality, and AI demonstration |
| 2:00–2:45 | Medical Officer review and specialist referral |
| 2:45–3:30 | Telemedicine and simulated diagnostic workflow |
| 3:30–4:15 | Patient timeline and District Officer dashboard |
| 4:15–5:00 | Offline workflow, security, and SAMMAKKA |

The demonstration should focus on a complete working workflow rather than spending too much time on decorative UI animations.

Prepare synthetic accounts and resettable demonstration data before the presentation.

## 14. Test Result Recording Template

Every executed test should be recorded.

| Field | Description |
|---|---|
| Test ID | Unique test identifier |
| Test Date | Date of execution |
| Tester | Person performing the test |
| Module | Application module |
| Test Scenario | What is being tested |
| Expected Result | Expected system behavior |
| Actual Result | Observed system behavior |
| Status | Pass / Fail / Blocked / Not Run |
| Evidence | Screenshot, log, or test report reference |
| Defect ID | Related defect, if any |
| Notes | Additional observations |

### 14.1 Test Status Definitions

- **PASS:** Actual result matches expected result.
- **FAIL:** Actual result does not match expected result.
- **BLOCKED:** Test cannot proceed because a dependency is unavailable.
- **NOT RUN:** Test has not yet been executed.

Do not mark planned tests as passed.

## 15. Bug Tracking and Resolution

Every discovered issue should be recorded with:

- Bug ID.
- Short title.
- Module.
- Description.
- Steps to reproduce.
- Expected result.
- Actual result.
- Severity.
- Priority.
- Screenshot or log reference.
- Assigned developer.
- Fix status.
- Retest result.

Suggested severity levels:

| Severity | Meaning |
|---|---|
| Critical | Security breach, data loss, or core workflow unavailable |
| High | Important workflow fails |
| Medium | Partial functionality or significant usability issue |
| Low | Minor visual or non-blocking issue |

### 15.1 Bug Resolution Workflow

1. Identify the issue.
2. Reproduce it.
3. Record evidence.
4. Assign severity and priority.
5. Fix the issue.
6. Repeat the failed test.
7. Perform regression testing.
8. Close the issue only after verification.

## 16. Final Acceptance Criteria

The hackathon demo is ready only when the following core requirements have been implemented and verified.

### Application Functionality

- [ ] React frontend is connected to the Express backend.
- [ ] MongoDB stores persistent application records.
- [ ] Authentication works.
- [ ] Six user roles are supported with appropriate permissions.
- [ ] Patient registration works.
- [ ] Unique Patient ID generation works.
- [ ] Screening workflow works.
- [ ] Image upload and preview work.
- [ ] Image-quality feedback works.
- [ ] AI demonstration adapter works with clear limitations.
- [ ] Medical Officer review works.
- [ ] Specialist review works.
- [ ] Referral workflow works.
- [ ] Appointment workflow works.
- [ ] One demonstration video consultation works.
- [ ] Simulated diagnostic workflow works.
- [ ] Patient timeline works.
- [ ] Audit events are recorded.
- [ ] District aggregate dashboard works.
- [ ] SAMMAKKA works on application pages.

### Language and Usability

- [ ] Telugu is available.
- [ ] English is available.
- [ ] Essential workflows work in both languages.
- [ ] Mobile-sized screens are usable.
- [ ] Forms and error messages are understandable.

### Offline and Security

- [ ] Offline registration demonstration works.
- [ ] Offline screening draft is retained.
- [ ] Synchronization works.
- [ ] Failed synchronization is handled safely.
- [ ] Unauthorized access is rejected by backend APIs.
- [ ] Sensitive image access is protected.
- [ ] Important changes are auditable.
- [ ] No real patient information is used.

### Demonstration and Submission

- [ ] Synthetic demonstration accounts are ready.
- [ ] Synthetic patient record is ready.
- [ ] Educational demonstration images are available.
- [ ] Simulated pathology report is clearly labelled.
- [ ] Five-minute demo has been rehearsed.
- [ ] Test results have been recorded.
- [ ] Known limitations are documented.
- [ ] Source code is version controlled.
- [ ] Installation and deployment instructions are available.

## 17. Final Hackathon Submission Checklist

Prepare the following deliverables:

1. Version-controlled project source repository.
2. Working deployed application or accessible demonstration build.
3. Evaluator login accounts for authorized roles.
4. Architecture documentation.
5. Database design documentation.
6. API documentation.
7. Installation and deployment guide.
8. AI provenance and limitation documentation.
9. Synthetic demonstration dataset and reset instructions.
10. Security, privacy, and RBAC documentation.
11. Test report, including offline and failure tests.
12. Telugu and English workflow demonstration.
13. Five-minute product demonstration.
14. Live jury presentation.
15. Future development and approved clinical-pilot roadmap.

## 18. Important Clinical and Ethical Limitations

AAROGYA DRISHTI is a hackathon demonstration platform.

The competition demonstration must use synthetic records, fictional actors, and licensed educational or demonstration images.

All mock or research AI outputs must be labelled:

**NOT FOR CLINICAL USE.**

The platform must not be presented as a clinically validated diagnostic system.

A screening photograph, AI output, or demonstration result cannot establish or exclude oral cancer.

Clinical assessment, diagnosis, biopsy, pathology, treatment decisions, and follow-up must remain under qualified healthcare professionals and applicable approved protocols.

A real-world pilot requires appropriate institutional authorization, clinical governance, privacy and security review, ethics and regulatory permissions where applicable, and approved operational procedures.

## 19. Future Testing Enhancements

After the hackathon demonstration, additional testing may include:

- Larger synthetic datasets.
- Automated browser end-to-end testing.
- Load and concurrency testing.
- Accessibility audits.
- Device compatibility testing.
- Backup restoration drills.
- Independent security assessment.
- Offline synchronization under extended network interruptions.
- Monitoring and operational alert testing.
- Clinical validation studies under approved governance, if a future clinical deployment is pursued.

These enhancements must not be represented as completed unless they have been performed.

---

## 20. Document Maintenance

This document should be updated whenever:

- A new module is introduced.
- An API workflow changes.
- Database models change.
- Role permissions change.
- Offline synchronization behavior changes.
- A new test is added.
- A defect is fixed.
- A test is executed and verified.
- Hackathon demonstration requirements change.

**Document Owner:** AAROGYA DRISHTI Development Team  
**Document:** TESTING_AND_DEMO.md  
**Status:** Initial Testing and Demonstration Plan  
**Last Updated:** 02 November 2026

**End of Document**