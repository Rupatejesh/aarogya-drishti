# AAROGYA DRISHTI — API DOCUMENTATION

## 1. Document Purpose

This document records the REST API architecture for AAROGYA DRISHTI and distinguishes implemented routes from planned routes.

The APIs will connect the React frontend with the Node.js and Express.js backend and MongoDB database.

The API system will support:

- User authentication and authorization.
- Patient registration and management.
- Health worker workflows.
- Oral screening records.
- Secure image uploads.
- AI-assisted demonstration screening.
- Medical Officer and Specialist reviews.
- Appointments and referrals.
- Diagnostics and pathology reports.
- Telemedicine consultations.
- Patient longitudinal records.
- Offline synchronization.
- Notifications and follow-up.
- SAMMAKKA application assistant.
- District Officer dashboard.
- Audit logging.

**Implementation status:** Phase 2 backend routes for registration, consent, ownership claims, screening, clinical review, referral, diagnostic orders/results, follow-up, and aggregate reporting are implemented. Routes described later as `/api/v1` examples or plans are not mounted unless explicitly listed here.

### Implemented API baseline (Phases 1, 2A, and 2)

The server mounts `/api`, not `/api/v1`. Implemented endpoints include:

| Method and path | Access | Status |
|---|---|---|
| `GET /api/auth/csrf` | Public | Issues the CSRF cookie/token used by browser mutations |
| `POST /api/auth/login` | Public, rate-limited | Implemented; issues an eight-hour HttpOnly session cookie and returns the database-derived user |
| `POST /api/auth/logout` | Authenticated | Implemented; increments the server-side token version and clears the session cookie |
| `GET /api/users/me` | Authenticated | Implemented |
| `POST /api/users/staff` | Admin | Implemented; provisions Medical Officer or Specialist |
| `POST /api/users/asha-worker` | Admin | Implemented |
| `POST /api/users/district-officer` | Admin | Implemented |
| `POST /api/users/itda-project-officer` | Admin | Implemented |
| `POST /api/patients` | ASHA Worker, Medical Officer | Implemented; Admin is not a clinical registration role |
| `GET /api/patients` | ASHA Worker, Medical Officer, Specialist | Implemented with role scope |
| `GET /api/patients/me` | Patient | Implemented for a linked account |
| `GET /api/patients/:id` | Patient, ASHA Worker, Medical Officer, Specialist | Implemented with route-level roles and server-side record scope |
| `POST /api/patients/:id/ownership-claims` | Medical Officer | Issues a single-use, ten-minute claim code after in-person verification; code is returned once and only its hash is stored |
| `POST /api/patients/:id/link-account` | Patient | Links only with a valid claim code bound to the same patient ID |
| `GET /api/users/asha-workers` | Medical Officer | Implemented; active ASHAs in the caller's PHC/mandal/district |
| `PATCH /api/patients/:id/assign-asha` | Medical Officer | Implemented; verifies patient and ASHA geography and audits assignment |
| `GET /api/patients/:id/consents` | Patient, assigned ASHA Worker, scoped Medical Officer | Implemented |
| `POST /api/patients/:id/consents` | ASHA Worker, Medical Officer | Implemented; records oral-screening consent |
| `POST /api/patients/:id/consents/ORAL_SCREENING/withdraw` | Patient, assigned ASHA Worker, scoped Medical Officer | Implemented; appends a withdrawal event |
| `POST /api/screenings` | ASHA Worker, Medical Officer | Implemented; active oral-screening consent required |
| `GET /api/screenings/patient/:patientId` | Patient, ASHA Worker, Medical Officer, Specialist | Implemented with record-level scope and clinical-review history |
| `GET /api/screenings/review-queue` | Medical Officer | Implemented; paginated and limited to the caller's patient scope |
| `POST /api/clinical-reviews` | Medical Officer, Specialist | Implemented; Specialist must have an assigned non-cancelled referral |
| `GET /api/referrals` | Medical Officer, Specialist | Patient-scope filtered; Specialists see only assigned referrals |
| `POST /api/referrals` | Medical Officer | Requires a Medical Officer recommendation on the screening |
| `PATCH /api/referrals/:referralId/specialist` | Medical Officer | Assigns/reassigns only an active Specialist in matching geography; assignment history is appended |
| `PATCH /api/referrals/:referralId/status` | Medical Officer, assigned Specialist | Enforces role-specific status transitions and records history |
| `POST /api/referrals/:referralId/completion-review` | Medical Officer | Reviews a Specialist-submitted completion; records decision and history |
| `POST /api/diagnostics` | Medical Officer, Specialist | Creates a scoped diagnostic order linked to its patient and optional screening/referral |
| `GET /api/diagnostics/patient/:patientId` | Patient, Medical Officer, Specialist | Returns only orders within the caller's patient/referral scope |
| `PATCH /api/diagnostics/:diagnosticId/status` | Medical Officer, Specialist | Enforces diagnostic status transitions and records history |
| `POST /api/diagnostics/:diagnosticId/result` | Medical Officer, assigned Specialist | Records attributed result text only after report receipt; no result is generated automatically |
| `POST /api/follow-ups` | Medical Officer, ASHA Worker | Schedules for an in-scope patient and geographically assigned worker |
| `GET /api/follow-ups/patient/:patientId` | Patient, ASHA Worker, Medical Officer, Specialist | Returns follow-ups only within the caller's patient scope |
| `PATCH /api/follow-ups/:followUpId` | Medical Officer, assigned ASHA Worker | Updates allowed status, assignment, visit notes, or due date with status history |
| `GET /api/dashboards/aggregate` | District Officer, ITDA Project Officer | Fixed monthly aggregates scoped to assigned geography; counts 1–4 and populations under five are suppressed |

### Phase 2A patient workflow API details

All paths below are mounted under `/api`. Browser requests use credentialed HttpOnly cookies and send the CSRF token in `X-CSRF-Token` for mutations; exact allowed-origin validation is also enforced. Bearer authentication remains available for compatibility and is migrated to a cookie by the server on successful authenticated requests. The server derives the actor and role from the authenticated account; clients cannot choose the acting user or elevate a role.

| Route | Request / behavior | Response and restrictions |
|---|---|---|
| `POST /patients` | Validated demographics, address, optional contact/exposure/symptoms, and registration-consent metadata (`purpose: PATIENT_REGISTRATION`, `granted: true`, version and language) | `201` with server-generated patient ID; `409` with possible demographic duplicate candidates; ASHA Worker and Medical Officer must register within assigned PHC/mandal. Phone equality alone is not used to establish identity. |
| `GET /users/asha-workers` | No client-supplied geography | Active ASHA accounts within the authenticated Medical Officer's PHC/mandal/district |
| `PATCH /patients/:id/assign-asha` | `{ "ashaWorkerId": "<user ObjectId>" }` | Medical-Officer-only; validates active ASHA role and PHC/mandal/district; assignment changes are audited |
| `GET /patients/:id/consents` | No body | Returns consent events available to the caller's patient scope |
| `POST /patients/:id/consents` | `{ "consentVersion": "...", "language": "TELUGU" }` | Appends an `ORAL_SCREENING` grant with server-derived recorder and timestamp |
| `POST /patients/:id/consents/ORAL_SCREENING/withdraw` | `{ "reason": "..." }` | Appends a denial/withdrawal event; prior events are preserved. Other consent-purpose withdrawal routes are not implemented. |
| `POST /screenings` | Patient ObjectId, date, one or more oral-region observations, symptoms, tobacco-use value and optional notes | Creates a `PENDING` screening after checking current oral-screening consent. ASHA Workers cannot set clinician-only status. No image URL/upload is accepted in this phase. |
| `GET /screenings/patient/:patientId` | Patient ObjectId in path | Returns authorized screening history with attached clinical reviews |
| `GET /screenings/review-queue?page=1&limit=20` | Optional pagination; limit capped at 100 | Medical-Officer-only; returns `PENDING` and `REQUIRES_REVIEW` records inside the officer's patient scope, including prior review history |
| `POST /clinical-reviews` | Screening ObjectId, `AGREE` / `DISAGREE` / `DEFER`, clinical observations, referral flag and conditional reason | Medical Officer or assigned Specialist only; one review per reviewer/screening; `DEFER` yields `REQUIRES_REVIEW`, other decisions yield `COMPLETED`. The clinical review and screening transition are transactional on supported MongoDB topologies. |

Registration and its initial consent record use a MongoDB transaction on replica-set/sharded deployments. On standalone MongoDB, if consent persistence fails after patient creation, the patient is preserved, a linked failure audit is attempted, and the request returns a safe service-unavailable error requiring staff review. Registration attempts for the same normalized demographic key, consent changes, and screening creation use MongoDB-backed workflow locks. These locks serialize cross-process requests without demographic uniqueness constraints; lock contention returns `409` and should be retried. Duplicate matching remains a human-review warning, not proof of identity. Legitimate family members are not merged or blocked by a demographic unique index.

### Phase 2 backend workflow details

- Ownership verification is in-person by a scoped Medical Officer. The random claim code is single-use, expires after ten minutes, is stored as a SHA-256 hash, and is never included in audit data. The claim route binds the code to the patient ID in the URL; names and phone numbers alone do not link records.
- Referral history includes status changes, Specialist assignments, and Medical Officer completion review. A Specialist can access and update only that Specialist's assigned referrals.
- Diagnostic orders are clinician-created. Results are attributed to the recording clinician and can be entered only after report receipt. Result and status access follows patient and Specialist referral scope.
- Follow-up records retain a patient, optional screening/referral, assigned ASHA Worker, due date, status history, and attributed visit notes. Missed status is recorded by an authorized worker or Medical Officer; no background scheduler automatically marks overdue records.
- The aggregate endpoint accepts no user-selected date, geography, or drill-down filters. It returns 12 fixed monthly periods, suppresses non-zero counts below five, and suppresses the report when the scoped active population is below five. It does not expose patient identifiers.
- Admin is an operational account-provisioning role. It cannot register patients, read identifiable patient records, or perform clinical workflow mutations.

No live database/API integration or browser-level workflow test has been executed for these Phase 2 routes in the current verification. See `TESTING_AND_DEMO.md` for exact checks and limitations.

The consent version values are configured in the client using `VITE_REGISTRATION_CONSENT_VERSION` and `VITE_ORAL_SCREENING_CONSENT_VERSION`. These versions identify facility-approved consent material; this application does not supply or claim to legally validate consent wording.

The `/api/v1` examples elsewhere in this design document describe the intended future API and are not mounted server routes.

## 2. Technology Stack

### Backend

- Node.js
- Express.js
- TypeScript
- Mongoose
- MongoDB Community Edition
- REST API architecture

### Frontend

- React
- Vite
- TypeScript
- React Router
- Axios

### API Communication

The frontend will communicate with the backend using HTTP requests and JSON responses.

Multipart requests will be used where file uploads are required.

## 3. Base API URL

Current development base URL:

`http://localhost:5000/api`

Current example:

`http://localhost:5000/api/auth/login`

Production deployments must use HTTPS.

The API is not currently versioned. `/api/v1` is a future design target.

## 4. API Design Principles

1. Use REST-style endpoint naming.
2. Use appropriate HTTP methods.
3. Return consistent JSON response structures.
4. Validate requests on the backend.
5. Authenticate protected endpoints.
6. Enforce role-based authorization.
7. Validate access to individual patient records.
8. Protect sensitive patient information.
9. Use pagination for large result sets.
10. Record important operations in audit logs.
11. Handle network and database failures safely.
12. Never expose secrets or internal stack traces.
13. Keep AI demonstration output separate from clinical decisions.
14. Support Telugu and English user interfaces.
15. Use synthetic patient data during hackathon testing.

## 5. HTTP Methods

| Method | Purpose |
|---|---|
| GET | Retrieve information |
| POST | Create a resource or initiate an operation |
| PUT | Replace or update a resource |
| PATCH | Partially update a resource |
| DELETE | Delete or deactivate a resource where authorized |

Sensitive clinical records should not be permanently deleted through ordinary application workflows. Approved retention and deletion policies must govern such operations.

## 6. Standard API Response Format

All APIs should follow a consistent response structure.

### 6.1 Successful Response

Example:

```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "patientId": "ADR-DEMO-0001",
    "fullName": "Synthetic Demo Patient"
  }
}
```

### 6.2 Error Response

Example:

```json
{
  "success": false,
  "message": "Invalid request",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

### 6.3 Paginated Response

Example:

```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}
```

The backend must validate pagination parameters and enforce reasonable maximum page sizes.

## 7. HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 204 | Successful request with no response body |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Permission denied |
| 404 | Resource not found |
| 409 | Conflict or duplicate record |
| 413 | File or request too large |
| 415 | Unsupported media type |
| 422 | Validation or business-rule failure |
| 429 | Too many requests |
| 500 | Internal server error |
| 503 | Service temporarily unavailable |

## 8. Authentication APIs

Planned base path:

`/api/v1/auth`

### 8.1 Login

**POST** `/auth/login`

Purpose: Authenticate an application user.

Request:

```json
{
  "identifier": "demo.user@example.test",
  "password": "demo-password"
}
```

The example credentials are placeholders and must not be used as real credentials.

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "USER_OBJECT_ID",
      "fullName": "Demo User",
      "role": "ASHA_WORKER",
      "assignedPHCId": "PHC_OBJECT_ID"
    }
  }
}
```

The response does not include the JWT. The server sets an eight-hour HttpOnly `aarogya_session` cookie. Browser mutations require the CSRF token obtained from `GET /api/auth/csrf` in the `X-CSRF-Token` header and an allowed `Origin`. The client uses `withCredentials: true`.

Authorization: Public endpoint with login rate limiting.

### 8.2 Logout

**POST** `/api/auth/logout`

Purpose: End the authenticated session.

Authorization: Authenticated users.

Implementation: increments the user's server-side token version; subsequent protected requests reject tokens with an older version. This ends all active sessions for that account.

### 8.3 Get Current User

**GET** `/api/users/me`

Purpose: Retrieve the current authenticated user's permitted profile information.

Authorization: Authenticated users.

`GET /api/auth/me` is not currently implemented.

### 8.4 Refresh Session

**POST** `/auth/refresh`

Purpose: Refresh an eligible session using the selected secure authentication mechanism.

Authorization: Valid refresh session.

### 8.5 Change Password

**PATCH** `/auth/change-password`

Request:

```json
{
  "currentPassword": "current-demo-password",
  "newPassword": "new-demo-password"
}
```

Authorization: Authenticated users.

### 8.6 Request Password Reset

**POST** `/auth/forgot-password`

Purpose: Start an approved password-reset process.

Authorization: Public, with rate limiting and safe responses that do not reveal whether an account exists.

### 8.7 Reset Password

**POST** `/auth/reset-password`

Purpose: Complete password reset using a valid, time-limited reset mechanism.

Authorization: Valid reset request.

## 9. User and Profile APIs

Base path:

`/api/v1/users`

### 9.1 Get Profile

**GET** `/users/profile`

Purpose: Retrieve the current user's profile.

Authorization: Authenticated users.

### 9.2 Update Profile

**PATCH** `/users/profile`

Purpose: Update permitted profile information.

Request:

```json
{
  "fullName": "Demo Health Worker",
  "preferredLanguage": "te"
}
```

Authorization: Authenticated users. Only permitted fields can be changed.

### 9.3 Upload Profile Photograph

**POST** `/users/profile/photo`

Content-Type: `multipart/form-data`

Purpose: Upload an authorized user's profile photograph.

Authorization: Authenticated users.

### 9.4 Get User Details

**GET** `/users/:userId`

Purpose: Retrieve permitted details of a user.

Authorization: Authorized users according to role and administrative permissions.

### 9.5 List Users

**GET** `/users`

Purpose: Retrieve users for authorized administration.

Query parameters:

- page
- limit
- role
- status
- facilityId

Authorization: Administrator.

### 9.6 Update User Role

**PATCH** `/users/:userId/role`

Purpose: Change a user's assigned role.

Authorization: Administrator with appropriate privilege.

Every role modification must be audited.

### 9.7 Deactivate User

**PATCH** `/users/:userId/status`

Purpose: Activate or deactivate an account.

Authorization: Administrator.

## 10. Patient Management APIs

Base path:

`/api/v1/patients`

### 10.1 Register Patient

**POST** `/patients`

Purpose: Register a new patient.

Request:

```json
{
  "fullName": "Synthetic Demo Patient",
  "age": 46,
  "gender": "UNSPECIFIED",
  "phone": "9000000000",
  "address": {
    "village": "G. Madugula",
    "gramPanchayat": "Demo Gram Panchayat",
    "mandal": "G. Madugula",
    "district": "Alluri Sitharama Raju",
    "state": "Andhra Pradesh"
  },
  "tobaccoHistory": {
    "usesTobacco": true,
    "tobaccoType": "CHEWING",
    "duration": "SIMULATED_HISTORY"
  },
  "consent": {
    "status": "GRANTED",
    "consentType": "DEMO_CONSENT"
  }
}
```

The above is a synthetic example for development.

Expected response:

```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "id": "PATIENT_OBJECT_ID",
    "patientId": "ADR-DEMO-0001"
  }
}
```

Authorization: ASHA Worker or other explicitly authorized registration role.

Requirements:

- Generate a unique Patient ID.
- Validate required information.
- Check for possible duplicate records.
- Record consent.
- Do not require Aadhaar.
- Record the registering user.

### 10.2 List Patients

**GET** `/patients`

Purpose: Retrieve authorized patient records.

Query parameters:

- page
- limit
- search
- village
- mandal
- facilityId
- status

Authorization: Authorized users with access to the requested records.

### 10.3 Get Patient Details

**GET** `/patients/:patientId`

Purpose: Retrieve a patient's permitted demographic and care information.

Authorization: Authorized users with an appropriate care relationship.

### 10.4 Update Patient Details

**PATCH** `/patients/:patientId`

Purpose: Update permitted demographic or contact details.

Authorization: Authorized users.

Important changes must be audited.

### 10.5 Check Possible Duplicate

**POST** `/patients/check-duplicate`

Purpose: Identify possible duplicate patient registrations.

Request:

```json
{
  "fullName": "Synthetic Demo Patient",
  "age": 46,
  "phone": "9000000000",
  "village": "G. Madugula"
}
```

Authorization: Authorized registration roles.

The endpoint must not expose unrelated patient records.

### 10.6 Get Patient Timeline

**GET** `/patients/:patientId/timeline`

Purpose: Retrieve the authorized longitudinal patient timeline.

Timeline may contain:

- Registration.
- Consent.
- Screening.
- AI demonstration history.
- Clinical reviews.
- Appointments.
- Referrals.
- Diagnostics.
- Consultation records.
- Follow-up activities.

Authorization: Authorized care-team users.

### 10.7 Get Patient Consent

**GET** `/patients/:patientId/consent`

Purpose: Retrieve consent information.

Authorization: Authorized users.

### 10.8 Update Consent

**PATCH** `/patients/:patientId/consent`

Purpose: Update consent status and record relevant details.

Authorization: Approved consent workflow roles.

Consent changes must be audited.

## 11. Health Worker APIs

Base path:

`/api/v1/healthworkers`

### 11.1 Create Health Worker Profile

**POST** `/healthworkers`

Purpose: Create a health worker profile linked to a user account.

Authorization: Administrator.

### 11.2 Get Health Worker Details

**GET** `/healthworkers/:workerId`

Purpose: Retrieve permitted worker profile details.

Authorization: Authorized users.

### 11.3 List Health Workers

**GET** `/healthworkers`

Purpose: Retrieve permitted health worker records.

Query parameters:

- page
- limit
- facilityId
- mandal
- status

Authorization: Administrator or authorized District Officer for permitted summaries.

### 11.4 Update Health Worker Assignment

**PATCH** `/healthworkers/:workerId/assignment`

Purpose: Update facility or geographic assignment.

Authorization: Administrator.

## 12. Facility APIs

Base path:

`/api/v1/facilities`

### 12.1 Create Facility

**POST** `/facilities`

Purpose: Register a PHC, hospital or diagnostic centre.

Authorization: Administrator.

### 12.2 List Facilities

**GET** `/facilities`

Query parameters:

- page
- limit
- district
- mandal
- facilityType
- specialty

Authorization: Authenticated users.

### 12.3 Get Facility Details

**GET** `/facilities/:facilityId`

Purpose: Retrieve facility information.

Authorization: Authenticated users, subject to permitted fields.

### 12.4 Update Facility

**PATCH** `/facilities/:facilityId`

Authorization: Administrator.

## 13. Screening APIs

Base path:

`/api/v1/screenings`

### 13.1 Create Screening Record

**POST** `/screenings`

Purpose: Create an oral screening visit.

Request:

```json
{
  "patientId": "PATIENT_OBJECT_ID",
  "facilityId": "FACILITY_OBJECT_ID",
  "screeningDate": "2026-11-02T10:00:00.000Z",
  "examinationViews": [
    "TONGUE",
    "INNER_CHEEK",
    "PALATE",
    "GUMS",
    "FLOOR_OF_MOUTH"
  ],
  "observations": [
    {
      "bodySite": "INNER_CHEEK",
      "description": "Synthetic demonstration observation"
    }
  ]
}
```

Authorization: Authorized ASHA Worker or Medical Officer.

### 13.2 List Screenings

**GET** `/screenings`

Query parameters:

- page
- limit
- patientId
- workerId
- facilityId
- status
- startDate
- endDate

Authorization: Authorized users.

### 13.3 Get Screening Details

**GET** `/screenings/:screeningId`

Purpose: Retrieve an authorized screening record.

Authorization: Authorized care-team users.

### 13.4 Update Screening Record

**PATCH** `/screenings/:screeningId`

Purpose: Update permitted screening information.

Authorization: Authorized screening roles.

Important changes must be audited.

### 13.5 Upload Screening Image

**POST** `/screenings/:screeningId/images`

Content-Type: `multipart/form-data`

Purpose: Upload a permitted screening photograph.

Authorization: Authorized screening roles.

Requirements:

- Validate file size.
- Validate actual file type.
- Generate a secure storage key.
- Store the image securely.
- Link it to the screening record.
- Record uploader and timestamp.

### 13.6 List Screening Images

**GET** `/screenings/:screeningId/images`

Purpose: Retrieve authorized image metadata and protected access references.

Authorization: Authorized care-team users.

Image delivery must use protected access mechanisms.

### 13.7 Get Image Quality Assessment

**POST** `/screenings/:screeningId/image-quality`

Purpose: Evaluate whether an uploaded demonstration image meets configured quality requirements.

Request:

```json
{
  "imageAssetId": "IMAGE_ASSET_ID"
}
```

Expected quality information may include:

- Blur.
- Lighting.
- Glare.
- Framing.
- Overall quality status.

Authorization: Authorized screening roles.

### 13.8 Request Image Recapture

**POST** `/screenings/:screeningId/recapture-request`

Purpose: Request another photograph when the available image is insufficient.

Authorization: Medical Officer or Specialist with access to the case.

## 14. AI Demonstration APIs

Base path:

`/api/v1/ai`

These endpoints are for demonstration integration only.

They must not be represented as clinically validated diagnostic services.

### 14.1 Create AI Demonstration Assessment

**POST** `/ai/assessments`

Purpose: Process a permitted demonstration image through the configured JavaScript/TypeScript-compatible AI adapter.

Request:

```json
{
  "screeningId": "SCREENING_OBJECT_ID",
  "imageAssetId": "IMAGE_ASSET_ID"
}
```

Expected response:

```json
{
  "success": true,
  "message": "Demonstration assessment completed",
  "data": {
    "assessmentId": "AI_ASSESSMENT_ID",
    "status": "SUSPICIOUS_FINDING_FOR_CLINICAL_REVIEW",
    "adapterName": "DEMO_ADAPTER",
    "modelVersion": "DEMO-1.0",
    "limitations": [
      "NOT FOR CLINICAL USE",
      "Does not provide a medical diagnosis"
    ]
  }
}
```

Possible demonstration states:

- IMAGE_INSUFFICIENT
- SUSPICIOUS_FINDING_FOR_CLINICAL_REVIEW
- NO_SUSPICIOUS_FINDING_IDENTIFIED_BY_DEMO_MODEL

Authorization: Authorized screening roles.

### 14.2 Get Assessment Details

**GET** `/ai/assessments/:assessmentId`

Purpose: Retrieve a permitted demonstration assessment.

Authorization: Authorized care-team users.

### 14.3 Get Screening Assessment History

**GET** `/ai/screenings/:screeningId/history`

Purpose: Retrieve previous demonstration assessment versions.

Authorization: Authorized care-team users.

### 14.4 Get AI Adapter Information

**GET** `/ai/adapter-info`

Purpose: Retrieve permitted adapter name, version and limitation information.

Authorization: Authenticated users with access to the AI feature.

### 14.5 AI Safety Requirements

- Do not generate a confirmed cancer diagnosis.
- Do not assign cancer stages.
- Do not claim a patient is cancer-free.
- Do not automatically create signed clinical decisions.
- Preserve AI output separately from clinical reviews.
- Record adapter version and processing time.
- Show the NOT FOR CLINICAL USE disclaimer.
- Require qualified clinical review for clinical decisions.

## 15. Clinical Review APIs

Base path:

`/api/v1/clinical-reviews`

### 15.1 Create Clinical Review

**POST** `/clinical-reviews`

Purpose: Record an authorized Medical Officer or Specialist review.

Request:

```json
{
  "screeningRecordId": "SCREENING_OBJECT_ID",
  "observations": "Synthetic demonstration clinical observation",
  "decision": "REFER_FOR_SPECIALIST_REVIEW",
  "aiAgreement": "DISAGREE",
  "referralRequired": true,
  "referralReason": "Demonstration referral reason"
}
```

Authorization: Medical Officer or authorized Specialist.

### 15.2 List Review Queue

**GET** `/clinical-reviews/queue`

Query parameters:

- page
- limit
- status
- facilityId
- priority

Authorization: Medical Officer or Specialist, according to assignment.

### 15.3 Get Review Details

**GET** `/clinical-reviews/:reviewId`

Authorization: Authorized reviewers.

### 15.4 Update Review

**PATCH** `/clinical-reviews/:reviewId`

Purpose: Update a review according to the permitted workflow.

Authorization: Authorized reviewer.

Changes to signed decisions must follow a controlled correction or addendum process. Previous versions must remain traceable.

### 15.5 Request Recapture

**POST** `/clinical-reviews/:reviewId/recapture`

Purpose: Request a new screening image.

Authorization: Medical Officer or Specialist.

### 15.6 Record Review Decision

**POST** `/clinical-reviews/:reviewId/decision`

Purpose: Record the reviewer's formal decision.

Authorization: Authorized Medical Officer or Specialist.

Clinical decisions must be attributable to the responsible clinician.

## 16. Appointment APIs

Base path:

`/api/v1/appointments`

### 16.1 Create Appointment

**POST** `/appointments`

Request:

```json
{
  "patientId": "PATIENT_OBJECT_ID",
  "facilityId": "FACILITY_OBJECT_ID",
  "appointmentType": "PHYSICAL",
  "appointmentDate": "2026-11-05T10:00:00.000Z"
}
```

Authorization: Authorized booking roles.

### 16.2 List Appointments

**GET** `/appointments`

Query parameters:

- page
- limit
- patientId
- facilityId
- specialistId
- status
- startDate
- endDate

Authorization: Authorized users.

### 16.3 Get Appointment Details

**GET** `/appointments/:appointmentId`

Authorization: Authorized users with access to the appointment.

### 16.4 Reschedule Appointment

**PATCH** `/appointments/:appointmentId/reschedule`

Request:

```json
{
  "newAppointmentDate": "2026-11-06T11:00:00.000Z",
  "reason": "Synthetic demonstration rescheduling"
}
```

Authorization: Authorized booking roles.

### 16.5 Cancel Appointment

**PATCH** `/appointments/:appointmentId/cancel`

Request:

```json
{
  "reason": "Synthetic demonstration cancellation"
}
```

Authorization: Authorized users.

### 16.6 Update Appointment Status

**PATCH** `/appointments/:appointmentId/status`

Purpose: Record booked, completed, missed or other permitted status transitions.

Authorization: Authorized facility staff or care-team roles.

## 17. Referral APIs

Base path:

`/api/v1/referrals`

### 17.1 Create Referral

**POST** `/referrals`

Request:

```json
{
  "patientId": "PATIENT_OBJECT_ID",
  "screeningRecordId": "SCREENING_OBJECT_ID",
  "destinationFacility": "FACILITY_OBJECT_ID",
  "specialty": "ORAL_MEDICINE",
  "reason": "Synthetic demonstration referral",
  "priority": "ROUTINE"
}
```

Authorization: Medical Officer or other explicitly authorized clinician.

### 17.2 List Referrals

**GET** `/referrals`

Query parameters:

- page
- limit
- patientId
- facilityId
- status
- priority

Authorization: Authorized users.

### 17.3 Get Referral Details

**GET** `/referrals/:referralId`

Authorization: Authorized care-team users.

### 17.4 Update Referral

**PATCH** `/referrals/:referralId`

Purpose: Update permitted referral details.

Authorization: Authorized users.

### 17.5 Update Referral Status

**PATCH** `/referrals/:referralId/status`

Purpose: Track acceptance, booking, completion or missed status.

Authorization: Authorized facility and care-team users.

### 17.6 Generate Referral Slip

**GET** `/referrals/:referralId/slip`

Purpose: Generate an authorized Telugu or English referral slip.

Query parameter:

- language: `te` or `en`

Authorization: Authorized care-team users.

The generated document must not expose information beyond what the recipient needs.

## 18. Diagnostics APIs

Base path:

`/api/v1/diagnostics`

### 18.1 Create Diagnostic Order

**POST** `/diagnostics`

Purpose: Record a clinician-directed investigation.

Request:

```json
{
  "patientId": "PATIENT_OBJECT_ID",
  "referralId": "REFERRAL_OBJECT_ID",
  "investigationType": "BIOPSY",
  "facilityId": "FACILITY_OBJECT_ID"
}
```

Authorization: Authorized clinician.

### 18.2 List Diagnostic Records

**GET** `/diagnostics`

Query parameters:

- page
- limit
- patientId
- referralId
- investigationType
- reportStatus

Authorization: Authorized clinical users.

### 18.3 Get Diagnostic Details

**GET** `/diagnostics/:diagnosticId`

Authorization: Authorized care-team users.

### 18.4 Update Diagnostic Status

**PATCH** `/diagnostics/:diagnosticId/status`

Purpose: Track investigation progress.

Possible states:

- ADVISED
- SCHEDULED
- PERFORMED
- SAMPLE_COLLECTED
- REPORT_PENDING
- REPORT_RECEIVED
- CLINICIAN_REVIEWED
- NEXT_ACTION_REQUIRED

Authorization: Authorized facility staff and clinicians, according to workflow.

### 18.5 Upload Diagnostic Report

**POST** `/diagnostics/:diagnosticId/report`

Content-Type: `multipart/form-data`

Purpose: Upload a permitted synthetic pathology or investigation report.

Authorization: Authorized facility staff.

### 18.6 Review Diagnostic Report

**POST** `/diagnostics/:diagnosticId/review`

Purpose: Record an authorized clinician's review and conclusion.

Request:

```json
{
  "clinicalConclusion": "SIMULATED_RESULT_FOR_DEMONSTRATION",
  "nextAction": "FOLLOW_UP_REQUIRED"
}
```

Authorization: Medical Officer or Specialist with appropriate access.

The API must distinguish report data from the clinician's recorded interpretation.

## 19. Telemedicine APIs

Base path:

`/api/v1/telemedicine`

### 19.1 Request Consultation

**POST** `/telemedicine/requests`

Purpose: Request a specialist consultation.

Authorization: Authorized care-team roles.

### 19.2 List Consultation Requests

**GET** `/telemedicine/requests`

Query parameters:

- page
- limit
- patientId
- specialistId
- status

Authorization: Authorized care-team users.

### 19.3 Create Consultation Session

**POST** `/telemedicine/sessions`

Purpose: Create a secure consultation session using the selected video provider.

Authorization: Authorized scheduling roles.

### 19.4 Get Consultation Session

**GET** `/telemedicine/sessions/:sessionId`

Purpose: Retrieve permitted meeting information.

Authorization: Authorized participants.

Time-limited meeting access must be generated securely. Permanent public meeting credentials must not be exposed.

### 19.5 End Consultation

**POST** `/telemedicine/sessions/:sessionId/end`

Authorization: Authorized consultation participants.

### 19.6 Save Consultation Notes

**POST** `/telemedicine/sessions/:sessionId/notes`

Purpose: Save consultation notes and next actions.

Authorization: Authorized clinician.

Video recording must remain disabled by default.

## 20. Follow-Up and Navigator APIs

Base path:

`/api/v1/follow-ups`

### 20.1 Create Follow-Up Task

**POST** `/follow-ups`

Purpose: Create a patient follow-up task.

Authorization: Authorized care-team roles.

### 20.2 List Follow-Up Tasks

**GET** `/follow-ups`

Query parameters:

- page
- limit
- patientId
- assignedWorkerId
- status
- dueDate

Authorization: Authorized users.

### 20.3 Update Follow-Up Task

**PATCH** `/follow-ups/:taskId`

Purpose: Update permitted follow-up information.

Authorization: Assigned navigator or authorized care-team user.

### 20.4 Record Contact Attempt

**POST** `/follow-ups/:taskId/contact-attempts`

Purpose: Record a contact attempt and its outcome.

Authorization: Assigned navigator or authorized health worker.

### 20.5 Record Missed Appointment Reason

**POST** `/follow-ups/:taskId/missed-appointment`

Purpose: Record the reason for a missed appointment and next action.

Authorization: Authorized care-team roles.

## 21. Notification APIs

Base path:

`/api/v1/notifications`

### 21.1 List Notifications

**GET** `/notifications`

Query parameters:

- page
- limit
- status

Authorization: Authenticated users. Users can access only their own permitted notifications.

### 21.2 Mark Notification as Read

**PATCH** `/notifications/:notificationId/read`

Authorization: Notification recipient.

### 21.3 Create Notification

**POST** `/notifications`

Purpose: Create an authorized reminder or application notification.

Authorization: Approved backend workflows and privileged notification roles.

### 21.4 Notification Language

Notifications should support:

- Telugu (`te`)
- English (`en`)

Notifications must not contain sensitive clinical information in lock-screen previews or unauthorized channels.

## 22. Offline Synchronization APIs

Base path:

`/api/v1/sync`

### 22.1 Submit Offline Changes

**POST** `/sync/push`

Purpose: Submit permitted offline records for synchronization.

Request:

```json
{
  "deviceReference": "DEMO-DEVICE-01",
  "operations": [
    {
      "localRecordId": "LOCAL-RECORD-001",
      "operationType": "CREATE",
      "resourceType": "PATIENT_REGISTRATION",
      "data": {
        "fullName": "Synthetic Offline Patient",
        "age": 46
      }
    }
  ]
}
```

Authorization: Authenticated user with permission to create the relevant records.

Requirements:

- Validate every operation.
- Verify record ownership and permissions.
- Prevent duplicate submissions.
- Handle conflicts safely.
- Never blindly trust client-supplied role or user identifiers.
- Return a result for each operation.

### 22.2 Retrieve Synchronization Status

**GET** `/sync/status`

Purpose: Retrieve permitted synchronization status information.

Authorization: Authenticated users.

### 22.3 Pull Server Changes

**GET** `/sync/pull`

Query parameters:

- cursor
- limit

Purpose: Retrieve authorized server-side changes since the last synchronization point.

Authorization: Authenticated users with permitted record access.

### 22.4 Retry Failed Synchronization

**POST** `/sync/retry`

Purpose: Retry eligible failed operations.

Authorization: Authenticated users.

The backend must prevent duplicate record creation during retries.

## 23. SAMMAKKA Assistant APIs

Base path:

`/api/v1/assistant`

Purpose: Provide application-use guidance through the friendly 3D assistant SAMMAKKA.

SAMMAKKA is an application-help assistant, not a medical diagnostic or treatment assistant.

### 23.1 Send Chat Message

**POST** `/assistant/chat`

Request:

```json
{
  "message": "How do I register a new patient?",
  "language": "en",
  "conversationId": "DEMO-CONVERSATION-01"
}
```

Expected response:

```json
{
  "success": true,
  "message": "Assistant response generated",
  "data": {
    "conversationId": "DEMO-CONVERSATION-01",
    "reply": "Open Patient Registration, enter the required details, record consent and submit the form.",
    "language": "en",
    "category": "APPLICATION_HELP"
  }
}
```

Authorization: Authenticated users.

### 23.2 Retrieve FAQ Categories

**GET** `/assistant/faqs`

Query parameter:

- language: `te` or `en`

Purpose: Retrieve curated application-help questions and answers.

Authorization: Authenticated users.

### 23.3 Retrieve FAQ Details

**GET** `/assistant/faqs/:faqId`

Purpose: Retrieve a permitted application-help answer.

Authorization: Authenticated users.

### 23.4 Assistant Safety Rules

SAMMAKKA may explain:

- Patient registration.
- Image upload.
- Application navigation.
- Appointment booking.
- Referral tracking.
- Language switching.
- Profile management.
- Basic troubleshooting.
- Application feature usage.

SAMMAKKA must not:

- Diagnose cancer.
- Interpret a patient's symptoms as a doctor.
- Recommend medical treatment.
- Override a clinician.
- Reassure patients that they do not have cancer.

Medical questions must be redirected to a qualified healthcare professional.

The first version will use a curated FAQ knowledge base. Any future AI integration must be evaluated and implemented through the backend with appropriate safety restrictions.

## 24. District Dashboard APIs

Base path:

`/api/v1/dashboard`

Purpose: Provide aggregate programme monitoring information.

### 24.1 Get District Overview

**GET** `/dashboard/district-overview`

Query parameters:

- startDate
- endDate
- district
- mandal
- facilityId

Response may include:

```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "totalPatients": 0,
    "totalScreenings": 0,
    "medicalReviews": 0,
    "suspiciousFindingsForReview": 0,
    "specialistReferrals": 0,
    "completedAppointments": 0,
    "overdueAppointments": 0
  }
}
```

Authorization: District Officer and authorized administrators.

### 24.2 Get Diagnostic Overview

**GET** `/dashboard/diagnostics`

Query parameters:

- startDate
- endDate
- mandal
- facilityId

Metrics may include:

- Biopsies advised.
- Biopsies completed.
- Pathology reports pending.
- Pathology reports received.
- Clinician-confirmed outcomes recorded.
- Treatment linkage.
- Follow-up status.

Authorization: District Officer and authorized administrators.

### 24.3 Get Geographic Summary

**GET** `/dashboard/geographic-summary`

Query parameters:

- district
- mandal
- facilityId

Purpose: Retrieve permitted aggregate village, mandal and PHC statistics.

Authorization: District Officer and authorized administrators.

### 24.4 Get Staff Workload Summary

**GET** `/dashboard/staff-workload`

Query parameters:

- facilityId
- mandal
- startDate
- endDate

Purpose: Retrieve permitted aggregate staff activity and workload summaries.

Authorization: District Officer and Administrator.

### 24.5 Export Aggregate Report

**GET** `/dashboard/export`

Query parameters:

- format
- startDate
- endDate
- mandal
- facilityId

Supported formats may include CSV.

Authorization: District Officer or Administrator with export permission.

All exports must be audited.

Identifiable patient data must not be included in aggregate exports by default.

## 25. Audit Log APIs

Base path:

`/api/v1/audit-logs`

### 25.1 List Audit Logs

**GET** `/audit-logs`

Query parameters:

- page
- limit
- actorId
- action
- resourceType
- startDate
- endDate

Authorization: Administrator with security-audit permission.

### 25.2 Get Audit Log Details

**GET** `/audit-logs/:logId`

Purpose: Retrieve permitted audit details.

Authorization: Administrator with security-audit permission.

Audit records must not be editable through ordinary application APIs.

## 26. Language Support APIs

Base path:

`/api/v1/settings`

### 26.1 Get Supported Languages

**GET** `/settings/languages`

Expected response:

```json
{
  "success": true,
  "data": {
    "languages": [
      {
        "code": "te",
        "name": "తెలుగు"
      },
      {
        "code": "en",
        "name": "English"
      }
    ],
    "defaultLanguage": "en"
  }
}
```

### 26.2 Update Preferred Language

**PATCH** `/settings/language`

Request:

```json
{
  "language": "te"
}
```

Authorization: Authenticated users.

The frontend must use the selected language for supported labels, messages, forms and assistant responses.

## 27. Common Query Parameters

List endpoints may support the following parameters:

| Parameter | Description |
|---|---|
| page | Page number |
| limit | Number of records per page |
| search | Search term |
| status | Workflow status |
| startDate | Start of date range |
| endDate | End of date range |
| facilityId | Facility filter |
| mandal | Mandal filter |
| village | Village filter |
| sortBy | Approved sorting field |
| order | asc or desc |

The backend must validate all query parameters.

Only approved sorting fields may be used.

## 28. Common Error Codes

| Error code | Meaning |
|---|---|
| AUTH_REQUIRED | Authentication required |
| INVALID_CREDENTIALS | Login credentials invalid |
| SESSION_EXPIRED | Session expired |
| ACCESS_DENIED | Permission denied |
| RESOURCE_NOT_FOUND | Requested record not found |
| VALIDATION_ERROR | Input validation failed |
| DUPLICATE_PATIENT | Possible duplicate patient |
| INVALID_FILE_TYPE | Unsupported upload type |
| FILE_TOO_LARGE | File exceeds allowed size |
| IMAGE_QUALITY_FAILED | Image does not meet quality requirements |
| AI_SERVICE_UNAVAILABLE | Demonstration adapter unavailable |
| SYNC_CONFLICT | Synchronization conflict |
| APPOINTMENT_CONFLICT | Appointment scheduling conflict |
| RATE_LIMIT_EXCEEDED | Too many requests |
| INTERNAL_SERVER_ERROR | Unexpected server error |

Error responses must not reveal sensitive internal details.

## 29. API Security Requirements

Every protected endpoint must follow these requirements:

1. Verify authentication.
2. Verify the user's role.
3. Verify assigned facility or care relationship where applicable.
4. Validate request data.
5. Validate referenced MongoDB records.
6. Return only permitted information.
7. Record important activities in audit logs.
8. Apply appropriate rate limits.
9. Protect sensitive uploads.
10. Handle errors safely.

Additional requirements:

- Use HTTPS in deployment.
- Store secrets only on the backend.
- Protect authentication sessions.
- Validate file content and size.
- Prevent unauthorized bulk exports.
- Apply CORS restrictions.
- Use secure HTTP headers.
- Protect against NoSQL injection.
- Do not trust client-supplied user IDs or roles.

## 30. Frontend API Integration

The React frontend will use Axios for backend communication.

Planned integration structure:

- A centralized Axios instance.
- A configured backend base URL.
- Shared request and response handling.
- Authentication/session handling.
- Consistent error handling.
- Loading and retry states.
- API service modules grouped by feature.

Planned service modules:

- authService
- userService
- patientService
- healthWorkerService
- facilityService
- screeningService
- aiService
- clinicalReviewService
- appointmentService
- referralService
- diagnosticService
- telemedicineService
- followUpService
- notificationService
- syncService
- assistantService
- dashboardService
- auditService

These are planned frontend modules and will be created during implementation.

## 31. Suggested Backend Folder Organization

Planned backend structure:

```text
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── environment.ts
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

Each module should have clearly separated routes, controllers, validation, services and database models.

## 32. API Testing Strategy

Planned API testing will cover:

### Authentication

- Valid login.
- Invalid login.
- Logout.
- Expired session.
- Unauthorized API request.
- Role-based access.

### Patient Management

- Valid registration.
- Missing required fields.
- Duplicate registration.
- Patient lookup.
- Unauthorized patient access.
- Consent handling.

### Screening and Images

- Create screening.
- Upload permitted image.
- Invalid file upload.
- Oversized file.
- Poor image quality.
- Unauthorized image access.

### AI Demonstration

- Successful mock assessment.
- Image-insufficient response.
- Adapter unavailable.
- Assessment history.
- AI and clinical decision separation.

### Clinical Reviews

- Authorized Medical Officer review.
- Unauthorized review attempt.
- Specialist assignment restrictions.
- Decision correction history.

### Appointments and Referrals

- Appointment creation.
- Rescheduling.
- Cancellation.
- Duplicate scheduling conflict.
- Referral creation.
- Referral completion tracking.

### Diagnostics

- Investigation order.
- Report upload.
- Unauthorized report access.
- Clinician review.
- Simulated pathology workflow.

### Offline Synchronization

- Offline record submission.
- Duplicate retry prevention.
- Failed synchronization.
- Recovery after network interruption.
- Synchronization conflict.

### District Dashboard

- Aggregate counts.
- Geographic filters.
- Role restrictions.
- Export authorization.
- Privacy of aggregate results.

### SAMMAKKA

- English application-help question.
- Telugu application-help question.
- FAQ response.
- Medical-question safe fallback.

## 33. API Implementation Status

The implemented Phase 1 endpoint baseline is listed in Section 1. All other endpoint designs in this document remain planned until their route, controller, validation, authorization, database operations, response, and tests are verified.

Use the following status values during development:

- NOT STARTED
- IN PROGRESS
- BLOCKED
- TESTING
- COMPLETED

An endpoint may be marked COMPLETED only when:

1. Its route exists.
2. Its controller is implemented.
3. Its validation is implemented.
4. Its authorization is implemented.
5. Its database operations work.
6. Its expected response is verified.
7. Relevant tests pass.

## 34. Future API Enhancements

Possible future enhancements include:

- More advanced reporting.
- Additional language support.
- Improved offline synchronization.
- Approved external healthcare-system integrations.
- Advanced notification delivery.
- Additional secure video features.
- Clinically validated AI integrations after appropriate review.

These enhancements are outside the initial implementation until approved and prioritized.

## 35. Clinical Safety and Intended Use

AAROGYA DRISHTI is a hackathon demonstration platform and is **NOT FOR CLINICAL USE**.

The API system must not be used to provide real-world cancer diagnosis, cancer staging, treatment recommendations or medical reassurance.

AI demonstration outputs must remain separate from clinician-entered decisions.

Only authorized healthcare professionals may enter clinical conclusions.

All hackathon patient records, images, consultations and clinical outcomes must be synthetic or otherwise explicitly permitted for demonstration.

---

**Document status:** Planned API specification.

**Project:** AAROGYA DRISHTI

**Backend:** Node.js + Express.js + TypeScript

**Database:** MongoDB Community Edition + Mongoose

**Frontend:** React + Vite + TypeScript

**Clinical status:** NOT FOR CLINICAL USE