# AAROGYA DRISHTI — MASTER IMPLEMENTATION PROMPT

> This is the central development instruction for GitHub Copilot.
> Existing project documentation and the official AAROHAN Hackathon 2026 PDF are mandatory references.
> Inspect before modifying. Preserve working code. Verify every feature.
# AAROGYA DRISHTI — MASTER IMPLEMENTATION PROMPT

## 1. PROJECT IDENTITY AND PRIMARY OBJECTIVE

Project Name: **AAROGYA DRISHTI**

Hackathon: **AAROHAN Inter-Centre Hackathon 2026**

Project Location: ITDA Paderu, Alluri Sitharama Raju District, Andhra Pradesh, India.

Project Root:
`C:\Users\YTC CHINTAPALLI\AAROGYA-DRISHTI-MERN`

Technology: **MERN Stack only**
- MongoDB
- Express.js
- React.js
- Node.js
- TypeScript where already configured and appropriate.

You are acting as a senior full-stack MERN engineer, software architect, security engineer, QA engineer and technical implementation partner.

Your responsibility is to turn the existing AAROGYA DRISHTI codebase into a functional, secure, integrated and demonstrable healthcare programme management application.

This is an existing project. Do not treat it as a new project.

The objective is not simply to create attractive screens. The application must have working backend functionality, persistent database operations, real frontend-backend integration, appropriate role-based permissions, validated workflows, security controls and demonstrable end-to-end functionality.

**The existing project, its working backend, existing documentation and official hackathon requirements take priority over unnecessary rewriting or redesign.**

---

## 2. MANDATORY PROJECT REFERENCES

Before implementation, inspect these references directly from the workspace:

1. Root `README.md`
2. `docs/PROJECT_REQUIREMENTS.md`
3. `docs/PROJECT_ARCHITECTURE.md`
4. `docs/DEVELOPMENT_ROADMAP.md`
5. `docs/DATABASE_DESIGN.md`
6. `docs/SECURITY_AND_PRIVACY.md`
7. `docs/API_DOCUMENTATION.md`
8. `docs/TESTING_AND_DEMO.md`
9. `docs/MASTER_IMPLEMENTATION_PROMPT.md`
10. Official AAROHAN Inter-Centre Hackathon 2026 PDF, if available.

The official PDF may currently be outside the project workspace, such as in the user's Downloads folder.

If it is not available in the workspace:
- Do not invent its requirements.
- Report that the official PDF is unavailable.
- Continue using the existing project documentation and the verified requirements already supplied.
- Ask for the official document only when necessary to verify an uncertain requirement.

Do not create duplicate README files or duplicate project documentation.

Do not overwrite existing documentation without inspecting and preserving its useful content.

Keep documentation synchronized with actual implementation.

---

## 3. FIRST ACTION: COMPLETE PROJECT AUDIT

Before changing any source files:

1. Inspect the entire existing project structure.
2. Inspect root, client and server package files.
3. Inspect all backend routes, controllers, services, models and middleware.
4. Inspect authentication, authorization and account provisioning.
5. Inspect all frontend pages, components, routes, API services and styles.
6. Inspect database models and existing records.
7. Inspect environment variable usage without displaying secret values.
8. Inspect existing tests and build configuration.
9. Identify existing working functionality.
10. Identify incomplete, duplicated, disconnected, insecure or broken functionality.

Prepare a project implementation audit and requirements traceability matrix.

For every requirement, record:
- Requirement ID
- Requirement description
- Relevant hackathon module
- Backend implementation
- Frontend implementation
- API integration
- Required role permissions
- Database persistence
- Automated tests
- Manual verification
- Current status
- Evidence
- Remaining work
- Blockers

Use only these status labels:

- NOT STARTED
- IN PROGRESS
- IMPLEMENTED — NOT TESTED
- TESTED — PASS
- BLOCKED
- DEFERRED — WITH REASON

**Do not modify files during the initial audit. Show the audit and proposed implementation phases first.**

---

## 4. HACKATHON PRIORITY AND SCORING

Evaluate every feature against the official AAROHAN Inter-Centre Hackathon 2026 requirements.

Use this working 100-mark prioritization framework, subject to verification against the official PDF:

| Area | Priority Weight |
|---|---:|
| Complete patient-care workflow | 20 |
| AI-assisted screening and safe AI integration | 15 |
| Medical Officer, Specialist, telemedicine and appointments | 15 |
| Patient records and diagnostics | 15 |
| Security, privacy and governance | 15 |
| Telugu support, offline capability and accessibility | 10 |
| Deployment, testing and documentation | 10 |
| **Total** | **100** |

Prioritize mandatory working workflows over optional visual effects.

For each feature, explain:
- Why it is required.
- Which hackathon requirement it satisfies.
- Which score area it supports.
- Whether it is mandatory, optional or deferred.
- How it will be tested and demonstrated.

Do not expand scope without a clear hackathon justification.

---

## 5. TECHNOLOGY AND ARCHITECTURE RULES

Maintain the existing MERN architecture.

Do not introduce:
- Python backend services.
- Django or Flask.
- A separate Java backend.
- Unnecessary microservices.
- Unnecessary databases.
- Unnecessary paid third-party services.
- New frameworks that duplicate existing functionality.

Use the existing architecture wherever possible.

Requirements:
- MongoDB persistence.
- Express REST APIs.
- React frontend.
- Secure backend authentication.
- Server-side role-based authorization.
- Input validation.
- Centralized error handling.
- Structured logging.
- Audit logging.
- Environment-based configuration.
- Reusable frontend components.
- Responsive design.
- Accessible controls.

Never expose:
- MongoDB credentials.
- JWT secrets.
- API keys.
- Password hashes.
- Private patient information.
- Sensitive environment variables.

Never commit `.env` files or secrets.

Use synthetic demo data only unless properly authorized data is explicitly available.

---

## 6. SEVEN USER ROLES AND ACCESS CONTROL

The application must support seven distinct roles:

1. PATIENT
2. ASHA_WORKER
3. MEDICAL_OFFICER
4. SPECIALIST
5. DISTRICT_OFFICER
6. ITDA_PROJECT_OFFICER
7. ADMIN

There must be one common login interface.

The backend must identify the authenticated user's actual role and return the appropriate dashboard.

Do not depend on a frontend role selector for authorization.

Do not trust role values stored in localStorage or supplied by the client.

The backend must independently enforce every permission.

### 6.1 PATIENT

The patient must be able to:
- View their own profile.
- View their own longitudinal medical records.
- View screening history.
- View appointments.
- View referrals.
- View diagnostic reports.
- View follow-up schedules.
- Access permitted telemedicine functionality.
- Receive appropriate notifications.
- Update permitted personal information.

Patients must never access another patient's records.

### 6.2 ASHA_WORKER

The ASHA worker must be able to:
- View assigned patients.
- Register patients with informed consent.
- Record screening information.
- Capture and upload permitted oral-health photographs.
- Perform image-quality checks.
- Record examination observations.
- Create referrals when permitted.
- Track patient follow-ups.
- View assigned patient status.
- Work offline where supported by the application.

An ASHA worker must not access unassigned patients without authorized permission.

### 6.3 MEDICAL_OFFICER

The Medical Officer must be able to:
- View authorized PHC patient lists.
- Review screenings.
- Review clinical observations.
- Review AI advisory outputs.
- Record clinical decisions.
- Create and manage referrals.
- Review diagnostic reports.
- Schedule or manage appointments.
- Record follow-up decisions.
- Participate in telemedicine workflows.

### 6.4 SPECIALIST

The Specialist must be able to:
- View assigned referrals.
- Access only permitted patient information.
- Review clinical observations and screening images.
- Record specialist assessments.
- Record recommendations and decisions.
- Review diagnostic reports.
- Document consultations.
- Update permitted referral status.

Specialists must not receive unrestricted access to all district patients.

### 6.5 DISTRICT_OFFICER

The District Officer must be able to:
- View district-level programme information.
- Monitor PHC and mandal performance.
- View authorized aggregated patient statistics.
- Monitor screenings and referrals.
- Track pending cases.
- Monitor follow-up completion.
- Review grievances.
- Monitor programme indicators.

Protect individual patient information by default.

### 6.6 ITDA_PROJECT_OFFICER

The ITDA Project Officer is a separate mandatory role.

Build a dedicated ITDA Project Officer dashboard.

It must support:
- Programme implementation monitoring.
- District, mandal and PHC coverage.
- Village-level programme progress.
- Health-worker activity and progress.
- Screening coverage.
- Referral tracking.
- Diagnostic progress.
- Follow-up completion.
- Pending case monitoring.
- Programme indicators.
- Grievance tracking.
- Authorized reports and summaries.

Do not simply duplicate the District Officer dashboard.

Clearly distinguish programme implementation monitoring from clinical decision-making.

### 6.7 ADMIN

The Admin must be able to:
- Manage user accounts.
- Provision authorized staff accounts.
- Assign and manage roles.
- Activate and deactivate accounts.
- Manage permitted system configuration.
- Review audit logs.
- Monitor system activity.
- Manage access policies.

Admin must not automatically receive unrestricted access to private clinical records merely because of the ADMIN role.

Sensitive access must follow explicit authorization and auditing requirements.

---

## 7. REGISTRATION, ACCOUNT PROVISIONING AND LOGIN

Implement secure account management.

### Registration

Public registration must be available only for patients.

Staff roles must be provisioned by authorized administrators or approved workflows.

Never allow users to select an arbitrary staff role during public registration.

Patient registration must include:
- Validated personal information.
- Unique patient identification.
- Contact information where available.
- Village, mandal and PHC information.
- Informed consent.
- Duplicate-patient checks.
- Appropriate account linking.

Do not silently create duplicate patient records.

### Authentication

Implement:
- Email or phone identifier login where supported.
- Password authentication.
- bcrypt password hashing.
- JWT authentication.
- Appropriate token expiration.
- Account-active checks.
- Rate limiting.
- Secure logout and token cleanup.
- Session-expiration handling.
- Clear authentication errors.

The backend must load the actual user record and enforce the actual role.

Do not implement fake OTP verification.

If OTP functionality is not configured, label it as pending rather than pretending it works.

---

## 8. COMPLETE PATIENT-CARE WORKFLOW

This is a central application requirement.

Implement and verify the following workflow:

1. Patient registration.
2. Consent collection.
3. Unique patient ID creation.
4. ASHA patient assignment.
5. Screening.
6. Oral examination observations.
7. Oral photograph capture and upload.
8. Image-quality validation.
9. AI-assisted screening advisory.
10. Medical Officer review.
11. Clinical decision.
12. Specialist referral where indicated.
13. Appointment scheduling.
14. Telemedicine or documented clinical consultation.
15. Diagnostic investigation order.
16. Investigation completion.
17. Report upload and review.
18. Clinician decision.
19. Follow-up scheduling.
20. Longitudinal patient record update.
21. Audit-log recording.
22. District and programme dashboard updates.

Every stage must be connected to persistent backend records.

A button that only changes the frontend display is not a completed feature.

### Screening and oral photographs

Support appropriate oral examination image categories, such as:
- Tongue.
- Inner cheeks.
- Palate.
- Gums.
- Floor of mouth.
- Lips.

Implement image validation and quality checks where practical.

Protect uploaded patient images with appropriate access controls.

### AI-assisted screening

AI must be advisory only.

Requirements:
- Clearly distinguish AI output from clinician decisions.
- Show confidence or limitations only when actually supported.
- Record model/version or simulation status.
- Provide transparent explanations where supported.
- Never automatically diagnose a patient.
- Never automatically prescribe treatment.
- Never replace Medical Officer or Specialist approval.

If no validated AI model is integrated, implement an explicitly labelled demonstration adapter.

Use the label:

**DEMO / SIMULATED AI — NOT FOR CLINICAL USE**

Do not claim that simulated AI is a validated diagnostic model.
Appointment creation.

Appointment availability where supported.

Referral-to-appointment association.

Appointment status.

Consultation documentation.

Reminder status.

Appointment completion or cancellation.

For telemedicine:

Use a real video-call integration only when it is configured and tested.

Protect consultation access.

Associate consultation records with authorized patients and clinicians.

Record consultation metadata and clinical documentation appropriately.

If no operational video integration exists, clearly report it as pending.

Do not create a fake video-call button and claim that telemedicine is operational.

A working video call must be demonstrated before claiming completion of that requirement.

11. PATIENT RECORDS AND DATA GOVERNANCE

Maintain a longitudinal patient record.

Record relevant:

Registration history.

Consent history.

Screenings.

Examination observations.

Uploaded images.

AI advisory outputs.

Clinical reviews.

Referrals.

Appointments.

Diagnostic investigations.

Reports.

Consultations.

Follow-ups.

Every sensitive access or modification must be appropriately audited.

Implement:

Patient-scoped access.

Role-scoped access.

Purpose-based access where required.

Consent checks.

Secure file access.

Audit trails.

Safe account linking.

Review any existing account-linking logic for weak verification.

Do not rely on a purpose field alone as a substitute for a strong authorization policy.

12. DISTRICT AND ITDA DASHBOARDS

Build functional dashboards using actual backend data.

Do not use hardcoded statistics as if they were real.

District dashboard:

PHC summaries.

Mandal summaries.

Screening progress.

Referral progress.

Pending reviews.

Follow-up completion.

Programme indicators.

ITDA Project Officer dashboard:

Programme implementation progress.

Village and PHC coverage.

Health-worker progress.

Screening completion.

Referral and diagnostic progress.

Follow-up performance.

Programme gaps.

Grievance status.

All displayed figures must originate from real database queries or be explicitly marked as synthetic demonstration data.

Provide loading, empty and error states.

13. FRONTEND DESIGN AND EXPERIENCE

Preserve the existing dark command-centre visual direction.

Do not replace the existing design with a generic admin template.

Existing design direction:

Dark navy and forest-inspired palette.

Eastern Ghats visual identity.

Professional healthcare command-centre interface.

Clear information hierarchy.

Reusable components.

Smooth and purposeful animations.

Responsive layout.

Accessible contrast and controls.

Preserve existing useful design elements after inspecting them.

Do not remove working pages, navigation or components without justification.

Languages

Prioritize:

Telugu.

English.

Hindi may be added where it does not delay mandatory functionality.

Telugu must be properly encoded and displayed. Check for mojibake or corrupted text.

SAMMAKKA assistant

The application assistant must be named SAMMAKKA.

Character concept:

Friendly 3D tribal-girl virtual assistant.

Supportive and culturally respectful.

Telugu, English and eventually Hindi.

Helps users understand application navigation and usage.

Does not diagnose diseases.

Does not prescribe medicines or treatment.

Remove the old Lion Guardian concept entirely.

Do not finalize the character design until the project owner has seen the animation and explicitly approved it.

Keep the assistant's application-help functionality separate from clinical decision-making.

14. OFFLINE SUPPORT AND ACCESSIBILITY

Where supported by the current architecture, implement:

Service worker.

IndexedDB storage.

Offline registration or screening drafts.

Safe synchronization when connectivity returns.

Conflict handling.

Visible synchronization status.

Retry and error handling.

Do not claim offline synchronization is complete without testing it.

Prioritize essential Telugu workflows.

Ensure accessible labels, keyboard navigation, readable text and appropriate contrast.

15. SECURITY AUDIT

Review the complete backend and frontend for:

Authentication bypass.

Broken role authorization.

Insecure direct object references.

Cross-patient data exposure.

Unauthorized file access.

Unsafe account linking.

Weak password handling.

Missing input validation.

NoSQL injection risks.

XSS risks.

CORS misconfiguration.

Missing rate limits.

Token handling problems.

Sensitive data leakage.

Missing audit records.

Excessive administrative privileges.

Pay special attention to patient access rules for:

PATIENT.

ASHA_WORKER.

MEDICAL_OFFICER.

SPECIALIST.

DISTRICT_OFFICER.

ITDA_PROJECT_OFFICER.

ADMIN.

Fix critical security defects before declaring the application ready for demonstration.

Do not weaken existing permissions just to make a demo work.

16. TESTING AND ACCEPTANCE CRITERIA

Create or improve automated tests using the existing test framework.

At minimum, test:

Authentication

Valid login.

Invalid login.

Inactive account.

Invalid token.

Expired token.

Logout/session cleanup.

Authorization

All seven roles.

Unauthorized dashboard access.

Unauthorized API access.

Cross-patient access attempts.

Assigned-patient restrictions.

PHC and mandal restrictions.

Specialist referral restrictions.

District and ITDA access scope.

Admin account-management permissions.

Patient workflow

Registration.

Consent.

Duplicate detection.

Screening creation.

Image validation.

Clinical review.

Referral creation.

Appointment workflow.

Diagnostic status transitions.

Report review.

Follow-up.

Audit logging.

Frontend

Successful login.

Role-based dashboard routing.

API integration.

Loading states.

Error states.

Empty states.

Logout.

Session expiration.

End-to-end acceptance

Demonstrate one complete synthetic patient journey:

Registration → Screening → Image quality check → AI advisory → Medical Officer review → Referral → Appointment → Consultation → Diagnostic investigation → Report review → Clinician decision → Follow-up → Audit record.

Use synthetic data only.

Do not use real patient information for testing or demos.

17. IMPLEMENTATION PHASES

After the initial audit and owner approval, implement in controlled phases.

PHASE A — Existing Project Audit

Inspect the whole project.

Identify working and incomplete features.

Produce traceability matrix.

Identify security defects.

Identify build and test problems.

Propose implementation order.

PHASE B — Backend and Role Security

Complete authentication.

Complete staff provisioning.

Verify all seven roles.

Fix patient data access.

Fix permission checks.

Improve audit logging.

Validate backend APIs.

PHASE C — Patient Workflow

Registration and consent.

ASHA assignment.

Screening.

Images.

AI advisory adapter.

Medical Officer review.

Referral.

Appointments.

Diagnostics.

Follow-up.

PHASE D — Seven Dashboards

Patient.

ASHA Worker.

Medical Officer.

Specialist.

District Officer.

ITDA Project Officer.

Admin.

Integrate every dashboard with actual backend APIs.

PHASE E — Additional Mandatory Capabilities

Telemedicine.

Diagnostic report handling.

Telugu essential workflows.

Offline functionality.

Grievance tracking.

Programme monitoring.

Prioritize the official hackathon requirements and available implementation time.

PHASE F — Testing and Security

Automated backend tests.

Frontend build and tests.

API integration tests.

Role-permission tests.

End-to-end synthetic patient journey.

Security fixes.

Manual verification.

PHASE G — Deployment and Final Demonstration

Environment configuration.

Deployment readiness.

Database configuration.

Production build.

Demo account preparation.

Synthetic data preparation.

Documentation updates.

Final hackathon demonstration checklist.

18. IMPLEMENTATION RULES FOR COPILOT

Follow these rules throughout the project:

Inspect before modifying.

Preserve existing working functionality.

Do not rewrite the entire project unnecessarily.

Do not create duplicate files.

Do not invent API endpoints.

Do not create fake backend functionality.

Do not use hardcoded data as real statistics.

Do not use fake authentication.

Do not bypass backend authorization.

Do not expose private information.

Do not claim tests passed without running them.

Do not claim features are complete without verification.

Do not silently remove existing features.

Do not install unnecessary dependencies.

Keep the application MERN-only.

Update documentation when implementation changes.

Explain blockers and dependencies clearly.

Prefer small, verifiable implementation steps.

Keep the application runnable after each phase.

Ask for approval before major architectural changes or destructive operations.

If an operation could delete data, overwrite useful files, alter database contents or break working functionality, inspect first and request approval.

Never print secret values in terminal output or reports.

19. COMPLETION STANDARD

A feature is not complete merely because a screen or button exists.

A feature is complete only when its applicable requirements are satisfied:

Database model and validation.

Backend service.

Controller and route.

Server-side authorization.

Frontend implementation.

Real API integration.

Persistent data operations.

Loading state.

Error state.

Empty state.

Automated tests.

Manual verification.

Security checks.

Documentation.

A feature may be marked TESTED — PASS only when there is actual test or verification evidence.

Clearly distinguish:

Implemented.

Tested.

Operational.

Demonstrable.

Pending external configuration.

Deferred.

Do not claim 100% completion without evidence.

20. FINAL REPORT FORMAT

At the end of each implementation phase, report:

What was inspected.

What was implemented.

Files created.

Files modified.

Existing functionality preserved.

APIs implemented or changed.

Database changes.

Security changes.

Tests executed.

Actual test results.

Build results.

Features verified manually.

Incomplete features.

Blockers.

Hackathon requirements satisfied.

Remaining hackathon score areas.

Exact next steps.

Use concise, understandable explanations.

Give exact file paths and commands where needed.

Do not report success based on assumptions.

21. FIRST COPILOT TASK — READ-ONLY AUDIT

Start with this task only. Do not implement anything yet.

Read the root README, this master prompt, every existing document in docs/, and the official hackathon PDF if it is available.

Inspect the complete existing client and server code.

Produce:

Project structure and technology inventory.

Existing backend functionality.

Existing frontend functionality.

Database model inventory.

API inventory.

Authentication and authorization audit.

Seven-role requirements matrix.

Dedicated ITDA Project Officer gap analysis.

Patient-care workflow gap analysis.

Telemedicine and diagnostic functionality status.

Security defect report.

Build and test status.

Hackathon requirements traceability matrix.

Prioritized implementation phases.

Risks and blockers.

Do not edit, delete, rename, overwrite or create source files during this first task.

Show the complete audit and wait for the project owner's approval before beginning implementation.

END OF MASTER IMPLEMENTATION PROMPT