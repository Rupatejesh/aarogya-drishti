# AAROGYA DRISHTI — SECURITY AND PRIVACY

## 1. Purpose

This document defines the planned security, privacy, access-control and data-protection requirements for AAROGYA DRISHTI.

AAROGYA DRISHTI is an AI-assisted oral cancer early-screening and patient-care coordination platform developed for the AAROHAN Inter-Centre Hackathon 2026.

The application uses the MERN technology stack:

- MongoDB Community Edition
- Mongoose
- Node.js
- Express.js
- React
- Vite
- TypeScript
- React Router
- Axios

The platform is intended to support patient registration, oral screening, AI-assisted demonstration, clinical review, appointments, referrals, diagnostics, telemedicine, follow-up and district-level reporting.

**Important:** The hackathon application is a demonstration system and is NOT FOR CLINICAL USE.

## 2. Security Objectives

The main security objectives are:

1. Protect patient and user information.
2. Prevent unauthorized access to application features.
3. Enforce role-based access control.
4. Protect authentication credentials and sessions.
5. Secure patient photographs and medical documents.
6. Protect data during network communication.
7. Protect permitted offline records.
8. Maintain audit trails for important activities.
9. Prevent unauthorized data modification and export.
10. Preserve the separation between AI demonstration output and clinical decisions.
11. Support privacy-conscious Telugu and English workflows.
12. Prepare a foundation for future authorized deployment.

## 3. Security Principles

The application will follow these principles:

### 3.1 Privacy by Design

Privacy must be considered during database design, API development, frontend development, testing and deployment.

Only information necessary for the intended workflow should be collected.

### 3.2 Least Privilege

Every user should receive only the permissions necessary for their assigned responsibilities.

### 3.3 Defense in Depth

Security must not depend on a single mechanism. Authentication, authorization, validation, encryption, audit logging and secure storage should work together.

### 3.4 Secure Defaults

New accounts, sessions, APIs, files and records should use restrictive default permissions.

### 3.5 Data Minimization

Do not collect unnecessary personal information.

Aadhaar must not be mandatory for patient registration.

### 3.6 Accountability

Important activities must be traceable to an authenticated user and timestamp.

### 3.7 Transparency

Users must receive understandable information about consent, data usage and the limitations of AI demonstration features.

## 4. User Roles and Access Control

The application will support seven user roles:

1. Patient
2. ASHA Worker
3. Medical Officer
4. Specialist
5. District Officer
6. ITDA Project Officer
7. Administrator

The role descriptions below include planned capabilities. Current Phase 2 enforcement and unimplemented areas are distinguished in section 26; planned permissions do not imply that a route or workflow exists.

Access must be enforced by the backend, not only by hiding frontend pages.

### 4.1 Patient

Permitted activities, subject to implementation and consent:

- View permitted personal profile information.
- View own appointment information.
- View permitted referral status.
- View authorized notifications.
- Manage permitted contact and language preferences.

Patients must not access another patient's records.

### 4.2 ASHA Worker

Permitted activities:

- Register patients within the assigned area.
- Record consent.
- Create screening records.
- View assigned patient records.

Restrictions:

- Cannot enter a Medical Officer's signed clinical conclusion.
- Cannot assign or reassign a patient to an ASHA Worker.
- Cannot change specialist decisions.
- Cannot access unrelated patient records.
- Cannot change administrator permissions.

Secure photograph capture/storage is not implemented. Follow-up scheduling and tracking exist in the backend; the frontend workflow and automatic overdue processing remain unimplemented.

### 4.3 Medical Officer

Permitted activities:

- Access authorized screening review queues.
- View permitted patient history and examination images.
- Review AI demonstration output.
- Record clinical observations.
- Agree, disagree or defer AI demonstration findings.
- Request image recapture.
- Record clinical decisions.
- Recommend referrals.
- Review investigation reports.
- Enter authorized clinical conclusions.

Clinical decisions must remain separate from AI-generated information.

### 4.4 Specialist

Permitted activities:

- Access assigned specialist referrals.
- Review authorized patient information.
- Conduct scheduled consultations.
- Record specialist observations.
- Recommend investigations.
- Record consultation outcomes.
- Update authorized follow-up information.

Specialists must not access unrelated patient records without an authorized care relationship.

### 4.5 District Officer

Permitted activities:

- View aggregate district-level programme indicators.
- Filter reports by village, PHC and mandal.
- View screening and referral statistics.
- Monitor overdue cases through authorized summaries.
- View staff workload and activity summaries.
- Export approved aggregate reports.

Restrictions:

- Identifiable patient information must not be visible by default.
- Individual patient-level access requires explicit authorization and audit logging.
- District-level reporting must not expose unnecessary contact details or medical photographs.

### 4.6 ITDA Project Officer

Permitted activities:

- View de-identified programme implementation summaries.
- Monitor authorized village, mandal, PHC, worker, referral, diagnostic, and follow-up indicators.
- Review aggregate grievance and programme-progress information when those modules are implemented.

Restrictions:

- No default access to identifiable patient records or clinical documents.
- Programme access must remain separate from clinical decision-making.
- The role must not inherit District Officer or Administrator permissions.

### 4.7 Administrator

Permitted activities:

- Manage application accounts.
- Assign and deactivate user roles.
- Manage facility information.
- Configure approved application settings.
- Review security and audit events.
- Manage authorized system-level operations.

Restrictions:

- Administrative access does not automatically authorize unrestricted clinical access.
- Privileged actions must be audited.
- Administrators must use individual accounts.
- Privileged accounts should use multi-factor authentication.

## 5. Role-Based Access Control Matrix

The following is the required permission model. The backend enforces individual patient-record scope independently of frontend visibility.

| Feature | Patient | ASHA Worker | Medical Officer | Specialist | District Officer | ITDA Project Officer | Administrator |
|---|---|---|---|---|---|---|---|
| Own profile | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Register patient | No | Assigned area | Authorized PHC | No | No | No | No |
| Create screening | No | Assigned patients | Authorized PHC | No | No | No | No |
| View identifiable patient record | Own linked record | Assigned patients | Assigned PHC/mandal/district | Assigned referral cases | No | No | No |
| Clinical review | No | No | Assigned PHC/mandal/district | Assigned referral cases | No | No | No |
| View programme dashboard | No | No | No | No | Aggregate only | Aggregate programme scope | System administration |
| Manage users | No | No | No | No | No | No | Authorized provisioning |
| View audit records | No | No | No | No | Aggregate summaries if implemented | Aggregate summaries if implemented | Authorized security audit |

All permissions must be validated on the server for every protected operation.

**Current implementation note:** patient-record access is fail-closed for District Officer, ITDA Project Officer, and Administrator roles. District Officer and ITDA Project Officer receive fixed, geography-scoped aggregate reports only; small counts are suppressed. Patient linking requires a single-use claim issued by a scoped Medical Officer after in-person identity verification. Admin provisioning does not grant clinical permissions: Admin cannot register patients, read identifiable patient records, or mutate clinical workflows.

## 6. Authentication Security

Authentication must be implemented using secure backend-controlled mechanisms.

### 6.1 Password Protection

Requirements:

- Never store plain-text passwords.
- Use a modern password-hashing algorithm such as Argon2id or bcrypt with an appropriate work factor.
- Never return password hashes in API responses.
- Never log passwords.
- Enforce reasonable password requirements.
- Provide secure password-reset workflows.
- Rate-limit login attempts.

### 6.2 Session Management

Requirements:

- Use secure session or token handling.
- Protect session identifiers.
- Use HTTPS in deployed environments.
- Apply appropriate session expiration.
- Support logout and session invalidation.
- Protect against session theft and reuse.
- Do not store sensitive authentication tokens in insecure browser storage.

If cookie-based authentication is selected:

- Use HttpOnly cookies.
- Use Secure cookies in HTTPS environments.
- Apply an appropriate SameSite policy.
- Implement CSRF protection where required.

**Current implementation:** the server issues an eight-hour JWT in an HttpOnly `SameSite=Lax` cookie, with `Secure` enabled in production. The cookie is scoped to `/api`. The database role and token version are checked on each authenticated request; logout increments the version and clears the cookie. Legacy bearer tokens remain temporarily accepted for compatibility and are migrated to a cookie on successful use. The browser removes a legacy local token after that successful response and does not store newly issued tokens in local storage.

Cookie-authenticated mutations and login require both a matching CSRF cookie/header token and an exact allowed `Origin`. The client uses credentialed requests. CORS allows credentials only for the configured origin allowlist (development localhost origins are provided outside production). The CSRF cookie is readable by the browser so the client can send the matching header; the session cookie remains HttpOnly. Production requires HTTPS for `Secure` cookies and an explicitly configured origin allowlist.

### 6.3 Multi-Factor Authentication

MFA should be required for privileged accounts, especially administrators.

Additional privileged access should be protected by stronger authentication controls.

### 6.4 Individual Accounts

Every user must have an individual account.

Shared staff accounts are not permitted.

## 7. API Security

All protected backend APIs must require authentication and authorization.

### 7.1 Backend Validation

Express.js APIs must validate:

- Required fields.
- Field types.
- String lengths.
- Numeric ranges.
- Date formats.
- MongoDB ObjectId values.
- Allowed enum values.
- File types and file sizes.
- User permissions.
- Related-record ownership or assignment.

### 7.2 Authorization Middleware

The backend should implement reusable middleware for:

- Authentication.
- Role verification.
- Assigned-facility verification.
- Patient-record access checks.
- Specialist assignment checks.
- Administrative permission checks.

Frontend route protection alone is insufficient.

### 7.3 API Error Handling

Requirements:

- Use consistent error response formats.
- Do not expose internal stack traces to users.
- Do not reveal database credentials or internal configuration.
- Avoid unnecessary sensitive information in error messages.
- Log operational errors safely.

### 7.4 Request Protection

Planned controls:

- Rate limiting.
- CORS allowlisting.
- Request-size limits.
- Secure HTTP headers.
- Input validation.
- Protection against NoSQL injection.
- Safe handling of user-supplied content.
- Secure file-upload validation.

The Express CORS allowlist is configured using comma-separated `CORS_ORIGINS`. Development defaults allow only `http://localhost:5173` and `http://127.0.0.1:5173`; production without configured origins allows no browser origins. Requests without an `Origin` header are not governed by browser CORS.

### 7.5 Sensitive API Responses

API responses must return only fields necessary for the requested operation.

Never return:

- Password hashes.
- Authentication secrets.
- Database connection strings.
- Private storage credentials.
- Unnecessary patient information.
- Internal security configuration.

## 8. MongoDB Security

MongoDB Community Edition will be used as the primary database.

Planned requirements:

1. Enable database authentication for deployed environments.
2. Create a dedicated database user for the application.
3. Grant only the permissions needed by the application.
4. Avoid using database administrator credentials in the application.
5. Restrict database network access.
6. Do not expose MongoDB directly to the public internet.
7. Store database credentials in backend environment variables.
8. Protect database backups.
9. Apply regular security updates.
10. Monitor database errors and operational status.

Development configuration may use a local MongoDB instance, but deployment must use a properly secured database configuration.

## 9. Environment Variables and Secrets

Secrets must never be placed in frontend source code.

Backend secrets may include:

- MongoDB connection string.
- Authentication secret.
- Session secret.
- Storage credentials.
- Video provider credentials.
- Future AI service credentials.

Requirements:

- Store secrets in backend environment variables.
- Maintain a `.env.example` containing placeholder values only.
- Add `.env` to `.gitignore`.
- Never commit real credentials to Git.
- Rotate exposed secrets immediately.
- Use separate development and production credentials.
- Restrict access to deployment secrets.

Example placeholder configuration:

`MONGODB_URI=your_local_or_secure_database_connection`

`JWT_SECRET=replace_with_a_secure_random_secret`

These are placeholders, not usable production credentials.

## 10. Encryption and Data Protection

### 10.1 Data in Transit

Deployed application communication must use HTTPS/TLS.

Requirements:

- Encrypt browser-to-backend communication.
- Use secure communication with external providers.
- Avoid sending sensitive records through unencrypted connections.
- Protect API authentication information during transmission.

### 10.2 Data at Rest

Sensitive information must receive appropriate encryption protection.

Consider:

- Database storage protection.
- Encrypted backups.
- Secure document storage.
- Protected device storage.
- Encryption-key management.

Encryption implementation must be selected and verified before any real patient data is used.

### 10.3 Encryption Key Management

Requirements:

- Do not hardcode encryption keys.
- Restrict access to encryption keys.
- Keep keys separate from encrypted data where practical.
- Define a rotation and recovery process.
- Never log encryption keys.

## 11. Patient Photograph and Document Security

Patient photographs and diagnostic documents are sensitive information.

Planned requirements:

1. Use protected file storage.
2. Do not use public image URLs.
3. Authorize access to every file.
4. Validate file type and size.
5. Generate safe storage identifiers.
6. Do not trust filenames supplied by users.
7. Scan uploads using an appropriate security process before production use.
8. Protect temporary files.
9. Apply retention and deletion policies.
10. Record important uploads and access events.

Images should be linked to authorized patient and screening records.

Image access must follow the same care-relationship and role restrictions as related patient records.

Profile photographs must also be protected from unauthorized access.

## 12. Offline Data Security

The application will support offline workflows through PWA capabilities and IndexedDB.

Offline requirements:

- Store only data needed for the permitted offline workflow.
- Avoid storing unnecessary patient information.
- Protect sensitive offline data using an appropriate encryption design.
- Protect local credentials and session information.
- Track pending synchronization operations.
- Prevent duplicate submissions.
- Handle synchronization conflicts safely.
- Provide a clear logout and device-access protection strategy.
- Clear or invalidate protected local data when appropriate.

**Important:** IndexedDB alone does not provide encryption.

Offline storage must not be described as encrypted unless encryption has actually been implemented and tested.

## 13. Audit Logging and Accountability

The application must maintain audit records for important operations.

Planned events:

- Successful login.
- Failed login.
- Logout.
- Patient registration.
- Patient-record access.
- Screening creation.
- Photograph upload.
- AI demonstration assessment.
- Clinical review.
- Clinical decision modification.
- Appointment booking.
- Referral creation.
- Diagnostic report upload.
- Record export.
- User-role modification.
- Permission changes.

The implemented event set additionally records successful and failed login, logout, user provisioning, patient registration, screening creation, clinical-review creation, referral creation/status changes, and diagnostic-order/status changes. Audit records support actor, action, resource ID, outcome, timestamp, and limited request metadata. Unimplemented modules do not yet emit their planned audit events.

Audit fields may include:

- Actor ID.
- Action.
- Resource type.
- Resource ID.
- Timestamp.
- Result.
- Limited contextual metadata.

Audit requirements:

- Record the authenticated actor.
- Use reliable timestamps.
- Restrict audit-log access.
- Prevent ordinary users from modifying audit entries.
- Avoid storing passwords, tokens or unnecessary clinical content in logs.
- Record relevant changes and access to sensitive information.
- Preserve history of important AI and clinical record updates.

## 14. AI Demonstration Security and Clinical Separation

AI functionality is a demonstration feature in the hackathon version.

Requirements:

1. Use a modular JavaScript/TypeScript-compatible AI adapter.
2. Keep AI service credentials on the backend.
3. Validate image inputs before processing.
4. Record the demonstration adapter or model version.
5. Record processing timestamps.
6. Store AI outputs separately from clinical reviews.
7. Prevent AI output from automatically becoming a clinical decision.
8. Allow authorized Medical Officers to agree, disagree or defer.
9. Preserve previous AI assessment versions.
10. Display limitations clearly.

Permitted demonstration states:

- Image insufficient for demonstration assessment.
- Suspicious finding for clinical review.
- No suspicious finding identified by the demonstration model.

The system must not:

- Diagnose oral cancer.
- Assign cancer stage.
- Claim that a patient is cancer-free.
- Automatically make treatment decisions.
- Replace clinical examination.
- Replace biopsy or pathology confirmation.

Every mock or research AI output must be labelled:

**NOT FOR CLINICAL USE**

## 15. Telemedicine Security

The telemedicine demonstration must use an appropriate video provider or SDK.

Planned requirements:

- Use time-limited meeting access.
- Restrict meeting access to authorized participants.
- Do not expose permanent meeting credentials.
- Protect meeting links.
- Avoid sensitive information in notifications.
- Keep video recording disabled by default.
- Store consultation notes in protected patient records.
- Restrict access to consultation information.
- Document the provider and its security limitations.

A real deployment requires an appropriate review of provider security, privacy, contractual requirements and applicable healthcare obligations.

## 16. Privacy and Consent Management

The application must record appropriate consent before permitted patient information is collected and processed.

Planned consent information:

- Consent status.
- Consent type.
- Consent version.
- Recorded date and time.
- Recording user.
- Relevant consent purpose.

Consent must be understandable to users.

Telugu and English consent workflows should be available.

The system should support appropriate withdrawal and correction workflows, subject to applicable legal and operational requirements.

Hackathon demonstration consent must use synthetic actors and demonstration records.

## 17. Indian Data Protection Considerations

The project should consider applicable Indian data-protection requirements, including the Digital Personal Data Protection Act, 2023, and applicable rules and notifications.

Before real-world deployment, the responsible organization must obtain appropriate legal and privacy review.

The implementation should define:

- Data collection purposes.
- Consent and notice workflows.
- Data minimization.
- Access and correction processes.
- Appropriate retention and deletion policies.
- Data security safeguards.
- Authorized data-sharing arrangements.
- Incident response responsibilities.
- Third-party provider responsibilities.

This document is a technical planning specification, not legal advice or a claim of legal compliance.

## 18. District Dashboard Privacy

The District Officer dashboard must primarily display aggregate information.

Permitted aggregate indicators may include:

- Registered patient counts.
- Screening counts.
- Medical Officer review counts.
- Suspicious findings requiring clinical review.
- Specialist referral counts.
- Appointment completion and overdue counts.
- Biopsy and pathology workflow counts.
- Clinician-entered outcome counts.
- Follow-up and treatment-linkage indicators.
- Average review and diagnostic turnaround time.

Privacy requirements:

- Do not display identifiable patient information by default.
- Avoid exposing individual contact information.
- Restrict individual record drill-down to explicitly authorized users.
- Audit authorized drill-down and export operations.
- Avoid very small group breakdowns that could identify individuals.

## 19. Backup and Disaster Recovery

Planned requirements:

1. Schedule regular MongoDB backups.
2. Protect backup files with appropriate encryption.
3. Restrict backup access.
4. Store backups separately from the primary database where appropriate.
5. Document database restoration steps.
6. Test restoration periodically.
7. Define backup retention periods.
8. Monitor backup failures.

The project must not claim that backups are operational until backup and restoration tests have succeeded.

## 20. Security Testing Plan

The following tests are planned for the hackathon application.

| Test | Expected result |
|---|---|
| Invalid login | Access denied with safe error |
| Unauthorized API request | Request rejected |
| Patient accesses another patient record | Access denied |
| ASHA Worker accesses unrelated patient | Access denied |
| Medical Officer accesses authorized review | Allowed |
| Specialist accesses assigned referral | Allowed |
| District Officer views aggregate dashboard | Allowed |
| District Officer requests unauthorized patient details | Access denied |
| Administrator changes authorized role | Action audited |
| Invalid file upload | Upload rejected |
| Oversized file upload | Upload rejected |
| Invalid database reference | Validation error |
| AI demonstration result | Separate from clinical decision |
| Expired session | Authentication required again |
| Unauthorized record export | Export denied |
| Offline synchronization retry | Duplicate records prevented |
| Audit event creation | Correct actor and timestamp recorded |

Test results must be documented after actual execution.

## 21. Hackathon Data Restrictions

Only synthetic patient records, synthetic actors and permitted educational or demonstration images may be used.

The hackathon demonstration must not use:

- Real patient records.
- Real patient photographs.
- Real clinical consultation recordings.
- Actual patient contact details.
- Unapproved medical documents.
- Real clinical decisions presented as demonstration results.

The compulsory synthetic demonstration scenario uses a simulated 46-year-old patient from G. Madugula.

All patient details and outcomes must remain clearly identified as simulated.

## 22. Security Incident Response

A future operational deployment should have a documented security incident response procedure.

The planned procedure should include:

1. Identify the suspected incident.
2. Restrict affected accounts or services where necessary.
3. Preserve relevant audit information.
4. Assess affected data and systems.
5. Notify responsible security and privacy personnel.
6. Follow applicable legal and organizational notification requirements.
7. Restore services safely.
8. Document the incident and corrective actions.

The hackathon team should also maintain a procedure for exposed credentials or accidental publication of synthetic/demo assets.

## 23. Security Implementation Checklist

This checklist is for development tracking.

- [ ] Secure password hashing implemented.
- [ ] Authentication implemented and tested.
- [ ] Session protection implemented.
- [ ] Role-based authorization implemented.
- [ ] Assigned-record access checks implemented.
- [ ] MongoDB access configured securely.
- [ ] Environment secrets protected.
- [ ] API validation implemented.
- [ ] Rate limiting configured.
- [ ] Secure HTTP headers configured.
- [ ] HTTPS enabled in deployed environment.
- [ ] Protected image and document storage implemented.
- [ ] Offline-data protection implemented and tested.
- [ ] Audit logging implemented.
- [ ] AI/clinical separation verified.
- [ ] Telemedicine access restrictions tested.
- [ ] Consent workflow implemented.
- [ ] Aggregate dashboard privacy verified.
- [ ] Backup and restoration tested.
- [ ] Security test results documented.

Do not mark an item complete until it has been implemented and verified.

## 24. Deployment Security Requirements

Before deploying the hackathon application:

- Use secure environment configuration.
- Disable unnecessary debug output.
- Use HTTPS.
- Restrict database access.
- Protect application secrets.
- Configure allowed frontend origins.
- Restrict privileged accounts.
- Review file-storage permissions.
- Verify API authorization.
- Review error responses.
- Prepare synthetic evaluator accounts.
- Test application recovery.
- Document known security limitations.

A public demonstration deployment must not contain real patient data.

## 25. Future Clinical Pilot Requirements

A real-world clinical pilot must not begin solely because the hackathon application works.

Before a pilot, the responsible organization must arrange:

- Appropriate institutional authorization.
- Qualified healthcare oversight.
- Approved clinical protocols.
- Relevant ethics and regulatory review.
- Independent security assessment.
- Privacy and legal review.
- Secure infrastructure.
- Approved data-sharing arrangements.
- Staff training.
- Incident response procedures.
- Clinical validation of any AI model intended for clinical use.
- Monitoring and post-deployment review.

## 26. Implementation Status

### Implemented and unit-tested for Phase 2

- Seven-role authorization remains enforced in backend routes and record-scope services. Patient, ASHA, Medical Officer, and assigned Specialist scopes are distinct; District Officer and ITDA Project Officer use aggregate-only access; Admin has operational account-provisioning permissions and no clinical record access by default.
- Registration keys same normalized demographic attempts with a temporary MongoDB workflow lock; no demographic or phone uniqueness constraint or automatic merge is used. Consent grant/withdrawal and screening creation share a per-patient lock, and screening checks current consent while holding it. Consent history is append-only.
- Ownership claims use an in-person Medical Officer verification step, a random single-use code, a ten-minute expiry, hashed code storage, patient-path binding, and audit events. Name/phone matching alone does not link an account.
- Referral creation requires a Medical Officer recommendation. Specialist assignment and status transitions are role-checked, assignment/status history is retained, and completion requires Medical Officer review.
- Diagnostic orders require a clinician and patient/referral association; attributed results can be recorded only after report receipt, with scoped visibility and status history.
- Follow-up scheduling, geographic ASHA assignment, allowed status transitions, missed status, due dates, attributed visit notes, and audit events are implemented.
- Aggregate reports are restricted to District Officer and ITDA Project Officer, use account geography, offer no caller-controlled drill-down, suppress counts from one to four, and suppress populations below five.
- Session issuance, database-backed role/token-version validation, logout revocation, HttpOnly cookie settings, CSRF/origin enforcement, CORS credential configuration, and legacy bearer-to-cookie migration are covered by unit tests.
- Audit events cover implemented authentication, ownership, patient workflow, referral, diagnostic, follow-up, and aggregate-report operations.

### Limitations and unimplemented protections

- Concurrency, workflow, and security tests use model mocks. No real MongoDB transaction/lock behavior, HTTP API integration, or browser workflow was exercised in this verification. Dedicated integration tests were not run because `MONGO_TEST_URI` was not present.
- Workflow locks have no TTL or automatic stale-lock recovery tool. A process crash before `finally` can leave a lock that blocks later operations; any manual recovery requires operator investigation and confirmation that the owning operation is no longer active.
- Aggregate suppression is a fixed minimum-count control, not a differential-privacy guarantee. There are no caller-controlled filters or identifiable drill-downs, but cross-scope differencing is not formally assessed.
- Consent wording is not supplied or legally reviewed by the application; facilities must configure and present approved consent materials.
- No secure photo upload, image storage, AI inference, prescribing, telemedicine, automated missed-follow-up scheduler, MFA, or production clinical deployment is implemented or validated.
- Integration, independent security assessment, clinical validation, accessibility and legal review remain outstanding. Build success and unit tests do not establish production readiness.

Documentation alone does not establish that an application is secure or legally compliant. The platform remains **NOT FOR CLINICAL USE**.

## 27. Final Safety Statement

AAROGYA DRISHTI is a hackathon demonstration platform and is **NOT FOR CLINICAL USE**.

It must not be used to provide real-world cancer diagnosis, screening decisions, treatment recommendations or medical reassurance.

All hackathon patient data, photographs, AI outputs, consultations and clinical outcomes must be synthetic or otherwise explicitly permitted for demonstration.

Patient safety, privacy, security and qualified clinical responsibility must remain central to any future authorized deployment.