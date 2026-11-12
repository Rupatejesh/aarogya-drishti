# AAROGYA DRISHTI — DEVELOPMENT ROADMAP

## 1. Purpose

This document defines the planned development sequence for AAROGYA DRISHTI, an AI-assisted oral cancer early-screening and patient-care coordination platform.

The project will be developed using the fixed MERN technology stack:

- MongoDB Community Edition
- Mongoose
- Node.js
- Express.js
- React
- Vite
- TypeScript
- React Router
- Axios

The hackathon version will use synthetic patient records and simulated clinical workflows. It is a demonstration system and is **NOT FOR CLINICAL USE**.

## 2. Development Principles

1. Build and test one module at a time.
2. Use a real backend and persistent MongoDB database.
3. Implement authentication and role-based access control before sensitive workflows.
4. Keep AI demonstration output separate from medical officer decisions.
5. Support Telugu and English throughout essential workflows.
6. Design for low-bandwidth and intermittent connectivity.
7. Use synthetic data and permitted demonstration images only.
8. Test each completed feature before moving to the next phase.
9. Do not expose passwords, API keys, or sensitive records in frontend code or logs.
10. Do not claim a feature is implemented until it has been built and tested.

## 3. Planned Development Phases

### Current implementation baseline

Phase 1 and Phase 2A patient registration/screening are implemented. The requested Phase 2 backend work now includes concurrency locks, verified account ownership claims, cookie-based sessions with CSRF protection, referral and diagnostic workflows, follow-up, and aggregate District/ITDA reporting. Seven-role authorization and patient-record scoping are enforced by the backend; the frontend workflow is not evidence that every role's end-to-end workflow has been verified.

Verification for the current Phase 2 code: 47 backend unit tests passed; backend typecheck/build, frontend lint, and frontend typecheck/production bundle passed. Dedicated MongoDB integration tests were not run because `MONGO_TEST_URI` was not present. No browser, live API, or deployment integration was tested. Backend lint is not configured. MFA, password reset, secure photo upload, AI inference, and production clinical deployment remain outstanding.

### Phase 2A — Core Patient Registration and Screening (Implemented)

**Status:** Implemented; automated checks pass. Integration with a live MongoDB deployment and end-to-end browser testing remain unverified.

Completed scope:
- Server-generated patient ID and backend registration validation.
- Registration consent event creation; facility-approved consent content remains externally configured.
- Same-PHC/mandal/district Medical Officer assignment of active ASHA accounts.
- Oral-region observations with active oral-screening consent required.
- Scoped patient history and Medical Officer review queue.
- Clinical review records with reviewer identity/timestamps and screening-state transitions.
- Role-aware frontend for registration, consent, assignment, ASHA patient lists, screening/history and Medical Officer review.

Known limitation: demographic duplicate matching is a human-review warning, not identity proof or a uniqueness constraint. Same-key registration attempts are serialized, but legitimate family members are not merged or blocked.

### Phase 2 Backend Completion (Implemented; integration unverified)

Implemented backend scope:
- Registration, consent, ownership-claim, screening, referral, diagnostic, follow-up, and aggregate-report services/routes.
- MongoDB-backed workflow locks for duplicate registration coordination, consent grant/withdrawal, screening creation, and ownership claims.
- HttpOnly session cookie, logout revocation, bearer-token migration compatibility, CSRF/origin checks, and credentialed CORS.
- Medical Officer referral creation and completion review; assigned-Specialist referral access and status transitions.
- Clinician-created diagnostic orders and attributed result recording after report receipt.
- Assigned-worker follow-up scheduling, status history, missed status, and visit notes.
- Fixed, geography-scoped aggregate reports with small-count suppression and no identifiable drill-down.

Limitations: unit tests use mocks. No dedicated MongoDB integration, HTTP API, or browser workflow test ran. Workflow locks have no automatic stale-lock recovery. Follow-up missed status is not automatically scheduled.

### Secure Oral Photo and Preliminary Screening (Not Started)

This earlier roadmap label describes the photo/AI scope, not the current Phase 2 backend completion. Do not begin photo capture until consent, storage, access, retention, and clinical-safety requirements are approved. Do not conflate AI output with a diagnosis. Planned scope:
1. Implement authenticated, size/type-validated oral-photo capture and private storage; reject arbitrary public URLs.
2. Record image metadata and access/audit events with patient consent and patient-access enforcement.
3. Add image-quality assessment and a recapture flow.
4. Add a non-diagnostic preliminary AI screening report, versioned and clearly labelled **NOT FOR CLINICAL USE**.
5. Keep clinician review separate and require authorized Medical Officer action.
6. Add isolated tests for upload abuse, access scope, consent, storage cleanup, image quality and AI/clinical separation.

### Phase 1 — Project Foundation

**Goal:** Prepare the development environment and application structure.

Tasks:
- Verify Node.js, npm, Git and MongoDB.
- Create the React + Vite + TypeScript frontend.
- Create the Node.js + Express backend.
- Configure environment variables.
- Connect Express to MongoDB using Mongoose.
- Configure frontend and backend development scripts.
- Add basic error handling and health-check endpoint.
- Initialize Git and create a project repository.

Completion criteria:
- Frontend starts successfully.
- Backend starts successfully.
- Backend connects to MongoDB.
- A test API request returns a successful response.

### Phase 2 — Database and Backend Foundation

**Goal:** Build the core database models and API structure.

Planned models:
- Users
- Patients
- HealthWorkers
- ScreeningRecords
- ClinicalReviews
- Appointments
- Referrals
- Diagnostics
- Facilities
- Notifications
- AuditLogs
- OfflineSyncMetadata

Tasks:
- Create Mongoose schemas and validation.
- Define relationships and references.
- Add unique patient ID generation.
- Implement duplicate patient detection.
- Create centralized API error handling.
- Add request validation.
- Document planned API endpoints.

Completion criteria:
- Data can be created and retrieved through API endpoints.
- Validation errors are handled safely.
- Records persist in MongoDB.

### Phase 3 — Authentication and Role-Based Access (Backend implemented; UI/operations incomplete)

**Goal:** Secure the application and separate user permissions.

Planned roles:
- Patient
- ASHA Worker
- Medical Officer
- Specialist
- District Officer
- ITDA Project Officer
- Administrator

Backend login/logout, password hashing, HttpOnly cookie sessions, CSRF/origin protection, token-version revocation, role middleware, record-scope checks and audit events are implemented. Remaining tasks:
- Add and validate MFA and secure password recovery.
- Verify all role-specific interfaces and full end-to-end permission workflows.
- Add user profile and profile-photo metadata only after secure storage requirements are met.

Completion criteria:
- Users can log in with authorized accounts.
- Unauthorized role access is blocked.
- Sensitive API endpoints require authentication.
- Important access and modification events are recorded.

### Phase 4 — Frontend Design and Navigation

**Goal:** Build the responsive application interface.

Tasks:
- Create the main application layout.
- Create a responsive sidebar and navigation.
- Create role-specific dashboards.
- Create reusable cards, forms, tables and status indicators.
- Add patient and staff profile interfaces.
- Implement Telugu and English language switching.
- Use accessible buttons, readable typography and clear error messages.
- Add the dark, immersive visual style inspired by modern interactive web experiences.

Completion criteria:
- Navigation works.
- Essential pages render correctly on desktop and mobile.
- Language switching works across essential workflows.
- Role-specific pages respect permissions.

### Phase 5 — Patient Registration and Health Worker Workflow (Phase 2A core delivered)

**Goal:** Enable health workers to register synthetic patients and record screening information.

Tasks:
- Core registration, consent event recording, demographic duplicate warning, patient assignment, oral observations, history and MO review are implemented in Phase 2A.
- Secure image capture, preview, recapture, quality assessment and image linking remain future work (Phase 2B).

Completion criteria:
- Core text-only workflow is complete; image-dependent criteria remain incomplete until Phase 2B.

### Phase 6 — AI-Assisted Demonstration Screening

**Goal:** Integrate a modular JavaScript/TypeScript-compatible demonstration inference interface.

Tasks:
- Define an AI adapter interface.
- Implement a mock demonstration adapter initially.
- Add image-quality checks.
- Return structured demonstration findings.
- Display the demonstration result and limitations.
- Record model or adapter version and timestamp.
- Store AI output separately from clinical decisions.
- Allow Medical Officers to agree, disagree or defer.

Permitted demonstration states:
- Image insufficient for demonstration assessment.
- Suspicious finding for clinical review.
- No suspicious finding identified by the demonstration model.

Completion criteria:
- AI demonstration flow works with permitted synthetic or educational images.
- Poor-quality images are handled.
- AI output is clearly labelled.
- The system never presents AI output as a confirmed diagnosis.

**Important:** The demonstration AI is NOT FOR CLINICAL USE. It must not diagnose cancer, determine cancer stage, or reassure users that they are cancer-free.

### Phase 7 — Medical Officer and Specialist Portal

**Goal:** Provide authorized clinical-review workflows for the simulated demonstration.

Tasks:
- Create review queue.
- Display patient history and screening images.
- Display AI demonstration output separately.
- Add clinical observation forms.
- Add agree, disagree and defer decisions.
- Add recapture requests.
- Add referral recommendations.
- Add signed clinical notes and timestamps.
- Provide specialist review and notes.

Completion criteria:
- Medical Officer can review a screening record.
- Clinical decisions are stored separately from AI output.
- Specialist access is restricted to authorized records.

### Phase 8 — Appointments, Referrals and Diagnostics

**Goal:** Demonstrate continuity of care and follow-up tracking.

**Backend status:** Referral creation, Specialist assignment/reassignment, status history, completion review, diagnostic order/status/result APIs, and their record-scope checks are implemented and unit-tested. General appointment booking, facility directory, file/report upload, notification/reminder, and full frontend workflows remain unimplemented or unverified.

Tasks:
- Create facility and specialist directory.
- Add appointment availability and booking.
- Add rescheduling and cancellation.
- Create physical referral records.
- Add referral status tracking.
- Add biopsy and investigation orders.
- Add simulated pathology report upload.
- Track investigation and report status.
- Support Telugu and English referral slips.
- Add reminder and overdue-case workflows.

Completion criteria:
- A synthetic patient can be referred.
- An appointment can be booked and tracked.
- A simulated investigation and pathology report can be linked to the patient record.
- Only authorized clinicians can enter clinical conclusions.

### Phase 9 — Telemedicine Demonstration

**Goal:** Demonstrate a secure specialist consultation workflow.

Tasks:
- Select a suitable JavaScript-compatible video provider or SDK.
- Implement authorized consultation requests.
- Add appointment scheduling.
- Generate time-limited meeting access.
- Test audio and video.
- Add consultation notes and outcomes.
- Add next-action tracking.
- Keep recording disabled by default.

Completion criteria:
- One complete demonstration video consultation works.
- Access is restricted to authorized participants.
- Consultation notes are saved in the patient timeline.

### Phase 10 — Patient Timeline and Follow-Up

**Goal:** Bring patient-related events together in one longitudinal record.

**Backend status:** Secure follow-up scheduling, assigned-worker checks, status history, missed status, and attributed visit notes are implemented and unit-tested. The frontend timeline, automatic overdue processing, treatment linkage, and end-to-end workflow remain outstanding.

Tasks:
- Display registration and consent history.
- Display screening records and images.
- Display AI demonstration history.
- Display clinical reviews and signed notes.
- Display appointments and referrals.
- Display investigations and reports.
- Add navigator assignment.
- Track contact attempts and missed appointments.
- Add follow-up tasks and treatment-linkage tracking.

Completion criteria:
- Authorized users can view a patient's chronological record.
- Important changes have timestamps and audit information.
- Follow-up status is visible.

Phase 11 — Offline Support and Synchronization

Goal: Support demonstration workflows during network interruptions.

Tasks:

Add PWA support.

Store permitted offline draft data in IndexedDB.

Protect sensitive offline data using an appropriate encryption design.

Track pending synchronization operations.

Implement retry and recovery handling.

Detect synchronization conflicts.

Prevent duplicate submissions.

Display pending, syncing, successful and failed states.

Completion criteria:

A synthetic patient registration can be completed offline.

The pending record synchronizes after connectivity returns.

Failed synchronization can be retried safely.

Security note: IndexedDB alone does not encrypt stored data. Offline protection requires additional safeguards.

Phase 12 — SAMMAKKA Assistant

Goal: Add the friendly 3D application-help assistant.

Tasks:

Create the original SAMMAKKA character asset.

Add a floating assistant button to every application page.

Create a chat panel.

Support Telugu and English.

Build a curated FAQ knowledge base.

Answer questions about using the application.

Add safe fallback messages for medical questions.

Keep assistant responses separate from clinical advice.

Completion criteria:

SAMMAKKA opens on every main application page.

Basic application-help questions receive useful answers.

Telugu and English responses work.

Medical diagnosis and treatment questions are referred to qualified professionals.

Phase 13 — District Officer Dashboard

Goal: Present aggregate programme information for district monitoring.

Tasks:

Display screening and review counts.

Display suspicious findings requiring clinical review.

Display referral and appointment indicators.

Display biopsy and pathology status.

Display clinician-confirmed outcomes entered in the demonstration.

Display follow-up and loss-to-follow-up indicators.

Add village, PHC and mandal filters.

Add staff workload summaries.

Add aggregate report export.

Completion criteria:

Dashboard metrics are calculated from stored demonstration records.

Filters work.

Aggregate information is shown by default.

Identifiable patient information is restricted to explicitly authorized access.

Phase 14 — Security, Testing and Quality Assurance

Goal: Verify the complete application and its security controls.

Tasks:

Test authentication and authorization.

Test role-specific permissions.

Test patient registration and duplicate detection.

Test image quality handling.

Test AI/clinical decision separation.

Test appointments and referrals.

Test video consultation.

Test offline synchronization.

Test Telugu and English workflows.

Test network failure and recovery.

Test audit logging.

Test data validation and error handling.

Review privacy and secure configuration.

Completion criteria:

Critical workflows pass their tests.

Unauthorized access attempts are blocked.

Known limitations are documented.

No real patient data is used in the hackathon demonstration.

Phase 15 — Deployment and Hackathon Submission

Goal: Prepare the working application for evaluation.

Tasks:

Prepare production-style frontend and backend builds.

Configure secure environment variables.

Deploy the application and database.

Prepare evaluator accounts for each role.

Prepare synthetic demonstration data.

Prepare a reset procedure.

Prepare API documentation.

Prepare architecture and database documentation.

Prepare installation and deployment instructions.

Prepare security and privacy documentation.

Prepare test results.

Record the five-minute product demonstration.

Prepare the live jury presentation.

Completion criteria:

Evaluators can access the deployed demo.

All core demonstration workflows work.

Documentation is complete.

The team can explain architecture, security, limitations and future clinical-pilot requirements.

4. Compulsory End-to-End Demonstration Scenario

The hackathon demonstration will use a synthetic 46-year-old patient from G. Madugula.

Planned flow:

Register the synthetic patient using Telugu.

Record tobacco-chewing history and a persistent white cheek patch as supplied scenario details.

Capture a permitted demonstration image.

Demonstrate image-quality validation.

Show clearly labelled AI demonstration output.

Submit the case for Medical Officer review.

Demonstrate clinical review and referral.

Conduct a secure specialist video consultation.

Create a physical appointment if required.

Create a simulated biopsy order.

Upload a simulated pathology report.

Demonstrate an authorized clinician entering the simulated result.

Display the longitudinal patient timeline.

Demonstrate navigator follow-up.

Show aggregate district dashboard indicators.

Demonstrate role-based access and audit logging.

All clinical details and outcomes in this scenario are simulated. They are not real medical advice or clinical findings.

5. Development Tracking

Each phase will be tracked using these statuses:

NOT STARTED

IN PROGRESS

BLOCKED

TESTING

COMPLETED

A phase should be marked COMPLETED only after its completion criteria have been verified.

6. Scope Control

The following are core hackathon priorities:

Patient registration and screening.

AI-assisted demonstration workflow.

Medical Officer and specialist review.

Appointment and referral management.

Diagnostics and simulated pathology workflow.

Longitudinal patient record.

Offline demonstration and synchronization.

Telugu and English workflows.

SAMMAKKA application assistant.

District Officer dashboard.

Security, privacy and audit controls.

Additional ideas such as ambulance coordination and drone logistics are outside the initial development scope unless separately approved.

7. Clinical and Regulatory Limitation

AAROGYA DRISHTI is a hackathon demonstration platform. It is NOT FOR CLINICAL USE.

A real-world pilot would require appropriate institutional authorization, clinical protocols, ethics and regulatory review where applicable, privacy safeguards, security assessment, and qualified healthcare oversight.