# AAROGYA DRISHTI — DATABASE DESIGN

## 1. Purpose

This document describes both the current MongoDB models and the planned database structure for AAROGYA DRISHTI.

The application will use:

- MongoDB Community Edition
- Mongoose ODM
- Node.js and Express.js backend
- TypeScript for backend development

The database is designed to support patient registration, oral screening, AI-assisted demonstration, clinical review, referrals, appointments, diagnostics, telemedicine, follow-up and district-level reporting.

**Implementation status:** Sections 4.1 and 4.2 describe implemented Mongoose models. Other collection descriptions remain planned unless explicitly marked as implemented. Model definitions do not imply that live-database integration has been verified.

## 2. Database Name

Planned database name:

`aarogya_drishti`

Development connection:

`mongodb://127.0.0.1:27017/aarogya_drishti`

The connection string must be stored in the backend environment configuration, not in frontend code.

## 3. Database Design Principles

1. Use separate collections for major business entities.
2. Use MongoDB ObjectId references to connect related records.
3. Generate a unique application-level Patient ID.
4. Validate all incoming data in the backend.
5. Store timestamps for important records.
6. Preserve historical clinical and AI records.
7. Restrict access using role-based authorization.
8. Store images and documents using secure storage references rather than public links.
9. Record important changes in audit logs.
10. Use synthetic records and demonstration images during hackathon development.

## 4. Planned Collections

The application will initially use these collections:

| Collection | Purpose |
|---|---|
| users | Login accounts and role information |
| patients | Patient demographic and contact information |
| healthworkers | Health worker profile and facility assignment |
| facilities | PHC, hospitals and specialist centres |
| screeningrecords | Screening visits and examination details |
| clinicalreviews | Medical Officer and specialist decisions |
| appointments | Appointment bookings and status |
| referrals | Referral and specialist-care tracking |
| diagnostics | Investigation and pathology workflow |
| notifications | Appointment and follow-up notifications |
| auditlogs | Important access and modification history |
| offlinesyncmetadata | Offline synchronization tracking |

### 4.1 Phase 2A Implemented Collections

The actual Mongoose models use these collections and relations. This subsection takes precedence over similarly named planned fields later in this document.

| Collection | Implemented fields and behavior |
|---|---|
| `patients` | `patientId` is generated server-side as `AD-<UUID>` and has a unique index; `fullName`, `dateOfBirth` and/or `age`, `sex`, `phone`, `alternateContact`, nested `address` (`village`, optional habitation/gram panchayat, `mandal`, `phcId`, server-set `district`), exposure history, symptoms, previous-screening details, `registrationStatus`, optional linked `user`, `assignedASHAWorker`, `createdBy`, and Mongoose timestamps. A unique sparse index protects the optional patient-user link. |
| `consents` | Append-only consent events: `patient` reference, `purpose`, `granted`, `consentVersion`, `language`, server-derived `recordedBy`, `recordedAt`, optional `withdrawnAt`, `withdrawalReason`, notes, and timestamps. An index supports patient/purpose/recent-event lookups. Withdrawal creates a new event; it does not overwrite the grant. |
| `screenings` | `patient` and `screenedBy` references, `screeningDate`, `symptoms`, `examinationFindings` (`bodySite`, observation, optional notes), `tobaccoUse`, optional clinician-only `clinicalStatus`, workflow `screeningStatus` (`PENDING`, `COMPLETED`, `REQUIRES_REVIEW`), timestamps, and a reserved AI-assessment subdocument. Indexes support patient and worker histories. Phase 2A stores no image URL or image. |
| `clinicalreviews` | `screening`, `patient`, and `reviewedBy` references; `reviewedAt`; decision (`AGREE`, `DISAGREE`, `DEFER`); clinical observations; optional notes; referral recommendation/reason; timestamps. Reviews are scoped and the same reviewer cannot submit another review for that screening. |
| `auditlogs` | Audit events for registration, consent, assignment, screening, clinical review and protected patient-record access, including actor, role, action, outcome, resource/patient references, purpose, request metadata and event timestamp as supported by the model. |

Patient registration and its initial consent are committed together in a MongoDB transaction on replica-set/sharded deployments. On standalone MongoDB, the service uses a compensating deletion if consent creation fails. Clinical-review creation and the screening-status update use the same transaction/fallback pattern. No schema migration or existing database-record rewrite was performed for Phase 2A.

### 4.2 Phase 2 backend models and concurrency records

| Model / collection | Implemented fields and behavior |
|---|---|
| `users` session fields | `tokenVersion` is checked against the signed session token on every authenticated request; logout increments the version to revoke outstanding sessions. Role and account activity are loaded from MongoDB rather than trusted from the token. |
| `ownershipclaims` | Patient reference, unique hash of a random one-time code, verifying Medical Officer, in-person verification method/time, ten-minute expiry, optional revocation and single-use claimant/time. The raw code is returned only when issued and is not stored or audited. |
| `workflowlocks` | MongoDB `_id` is the lock key; `owner` identifies the request and `createdAt` records acquisition. Locks serialize matching patient-registration demographics and per-patient consent/ownership operations across server processes. Consent withdrawal/grant and screening creation share the same per-patient lock. Locks are released in `finally`; there is no TTL or automatic stale-lock recovery. |
| `referrals` | Patient and screening references, creating Medical Officer, optional assigned Specialist, reason/priority/facility/date, status, append-only status history, assignment history, and Medical Officer completion reviews. Specialist queries and mutations are restricted to assigned referrals. |
| `diagnosticorders` | Patient and optional screening/referral references, ordering clinician, type/reason/facility/date, status history, report receipt metadata, attributed result entries, and clinician review metadata. Results are not created automatically. |
| `followups` | Patient and optional screening/referral references, assigned ASHA Worker, creator, due date, status, append-only status history, and attributed visit notes. |
| `auditlogs` | Phase 2 adds ownership-claim issuance/linking, referral assignment/status/completion review, diagnostic result/status, follow-up, and aggregate-report access events, in addition to the previously implemented events. |

No demographic or phone-number uniqueness index was added. Existing patient IDs and records are not rewritten or automatically merged. No migration or database operation against `aarogya_drishti` was performed for this phase. Real-database index creation and transaction behavior remain unverified until the dedicated test database is available.

## 5. Users Collection

Collection: `users`

Purpose: Store application login accounts and role information.

Planned fields:

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | MongoDB document ID |
| fullName | String | User's display name |
| email | String | Login email, where applicable |
| phone | String | Login or contact number, where applicable |
| passwordHash | String | Secure password hash |
| role | String | Authorized application role |
| tokenVersion | Number | Version used to revoke previously issued JWTs |
| profilePhoto | Object | Secure profile-photo metadata |
| preferredLanguage | String | Telugu or English |
| assignedFacility | ObjectId | Related facility |
| isActive | Boolean | Account status |
| lastLoginAt | Date | Last successful login |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

Allowed roles:

- PATIENT
- ASHA_WORKER
- MEDICAL_OFFICER
- SPECIALIST
- DISTRICT_OFFICER
- ITDA_PROJECT_OFFICER
- ADMIN

Security:

Never store plain-text passwords.

Enforce unique login identifiers where applicable.

Restrict role changes to authorized administrators.

Do not allow users to assign themselves privileged roles.

Do not expose password hashes through API responses.

6. Patients Collection

Collection: patients

Purpose: Store patient registration and demographic details.

Planned fields:

Field

Type

Description

_id

ObjectId

MongoDB document ID

patientId

String

Generated unique Patient ID

fullName

String

Patient name

age

Number

Age in years, where available

gender

String

Patient-provided demographic information

phone

String

Contact number, where available

alternatePhone

String

Optional alternate contact

address

Object

Address information

village

String

Village or habitation

gramPanchayat

String

Gram Panchayat

mandal

String

Mandal

district

String

District

phc

ObjectId

Related PHC facility

tobaccoHistory

Object

Relevant exposure history

symptoms

Array

Patient-reported symptoms

previousScreening

Boolean

Previous screening information

consent

Object

Consent status and details

registrationWorker

ObjectId

Registering health worker

createdAt

Date

Registration timestamp

updatedAt

Date

Last update timestamp

Patient ID:

Generate a unique application-level identifier.

Do not use Aadhaar as a mandatory identifier.

Enforce a unique database index on patientId.

Handle duplicate-registration attempts.

Address example:

village

gramPanchayat

mandal

district

state

postalCode

Tobacco history example:

usesTobacco

tobaccoType

duration

frequency

otherRelevantExposure

Consent example:

status

consentType

recordedAt

recordedBy

consentVersion

Privacy:

Patient records must be accessible only to authorized users.

Do not expose patient contact details in aggregate district dashboards.

Record access to sensitive patient information where required.

7. HealthWorkers Collection

Collection: healthworkers

Purpose: Store health worker professional and assignment details.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

userId

ObjectId

Related user account

workerId

String

Worker identification code

designation

String

Worker designation

assignedFacility

ObjectId

Assigned facility

assignedVillage

String

Assigned village

assignedMandal

String

Assigned mandal

profilePhoto

Object

Secure image metadata

isActive

Boolean

Assignment status

createdAt

Date

Creation timestamp

updatedAt

Date

Update timestamp

A health worker profile must be linked to an authorized user account.

8. Facilities Collection

Collection: facilities

Purpose: Store PHCs, hospitals, diagnostic centres and specialist facilities.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

facilityName

String

Facility name

facilityType

String

PHC, hospital or diagnostic centre

facilityCode

String

Facility identification code

district

String

District

mandal

String

Mandal

address

String

Facility address

phone

String

Contact number

availableSpecialties

Array

Supported specialties

isActive

Boolean

Facility status

createdAt

Date

Creation timestamp

updatedAt

Date

Update timestamp

9. ScreeningRecords Collection

Collection: screeningrecords

Purpose: Store oral examination and screening visit information.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

patientId

ObjectId

Related patient

screeningWorker

ObjectId

Health worker

facilityId

ObjectId

Screening facility

screeningDate

Date

Screening date

examinationViews

Array

Guided examination views

observations

Array

Recorded observations

imageAssets

Array

Secure image metadata references

imageQuality

Object

Quality assessment

aiAssessment

Object

Demonstration AI information

status

String

Screening workflow status

createdAt

Date

Creation timestamp

updatedAt

Date

Update timestamp

Guided examination views:

TONGUE

INNER_CHEEK

PALATE

GUMS

FLOOR_OF_MOUTH

Image quality fields may include:

blurStatus

lightingStatus

glareStatus

framingStatus

qualityMessage

AI demonstration fields:

adapterName

modelVersion

assessmentStatus

demonstrationFindings

limitations

processedAt

AI output must be stored separately from clinical conclusions.

Permitted demonstration assessment states:

IMAGE_INSUFFICIENT

SUSPICIOUS_FINDING_FOR_CLINICAL_REVIEW

NO_SUSPICIOUS_FINDING_IDENTIFIED_BY_DEMO_MODEL

These states must not be represented as a confirmed diagnosis.

10. ClinicalReviews Collection

Collection: clinicalreviews

Purpose: Store Medical Officer and specialist review decisions.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

screeningRecordId

ObjectId

Related screening

patientId

ObjectId

Related patient

reviewerId

ObjectId

Reviewing user

reviewerRole

String

Medical Officer or Specialist

observations

String

Clinical observations

decision

String

Review decision

aiAgreement

String

Agree, disagree or not assessed

recaptureRequested

Boolean

Image recapture requirement

referralRequired

Boolean

Referral recommendation

referralReason

String

Reason for referral

signedAt

Date

Review timestamp

createdAt

Date

Creation timestamp

updatedAt

Date

Update timestamp

Clinical decisions must be entered by authorized healthcare professionals.

AI output must never automatically become a signed clinical decision.

11. Appointments Collection

Collection: appointments

Purpose: Store patient appointments and scheduling details.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

patientId

ObjectId

Related patient

facilityId

ObjectId

Appointment facility

specialistId

ObjectId

Assigned specialist, if applicable

referralId

ObjectId

Related referral, if applicable

appointmentDate

Date

Appointment date and time

appointmentType

String

Physical or telemedicine

status

String

Booking status

meetingReference

String

Protected video-session reference

reminderStatus

String

Notification status

cancellationReason

String

Cancellation reason

createdBy

ObjectId

Booking user

createdAt

Date

Creation timestamp

updatedAt

Date

Update timestamp

Planned statuses:

REQUESTED

BOOKED

RESCHEDULED

COMPLETED

CANCELLED

MISSED

Meeting references must not contain public or permanent meeting credentials.

12. Referrals Collection

Collection: referrals

Purpose: Track specialist and hospital referrals.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

patientId

ObjectId

Related patient

screeningRecordId

ObjectId

Related screening

referringDoctor

ObjectId

Referring clinician

destinationFacility

ObjectId

Referral destination

specialty

String

Required specialty

reason

String

Referral reason

priority

String

Referral priority

referralDate

Date

Referral creation date

status

String

Referral status

appointmentId

ObjectId

Related appointment

attendanceStatus

String

Attendance information

completionNotes

String

Authorized completion notes

createdAt

Date

Creation timestamp

updatedAt

Date

Update timestamp

Planned statuses:

CREATED

SENT

ACCEPTED

APPOINTMENT_BOOKED

COMPLETED

MISSED

CANCELLED

13. Diagnostics Collection

Collection: diagnostics

Purpose: Track investigations and pathology workflow.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

patientId

ObjectId

Related patient

referralId

ObjectId

Related referral

orderedBy

ObjectId

Authorized clinician

investigationType

String

Investigation type

facilityId

ObjectId

Performing facility

orderDate

Date

Order timestamp

scheduledDate

Date

Scheduled date

performedDate

Date

Performed date

reportAsset

Object

Secure report metadata

reportStatus

String

Report workflow status

reviewedBy

ObjectId

Reviewing clinician

clinicalConclusion

String

Clinician-entered conclusion

reviewedAt

Date

Clinical review timestamp

createdAt

Date

Creation timestamp

updatedAt

Date

Update timestamp

Investigation types may include:

SPECIALIST_REEXAMINATION

BIOPSY

HISTOPATHOLOGY

CT

MRI

OTHER_CLINICIAN_ORDERED_TEST

Planned statuses:

ADVISED

SCHEDULED

PERFORMED

SAMPLE_COLLECTED

REPORT_PENDING

REPORT_RECEIVED

CLINICIAN_REVIEWED

NEXT_ACTION_REQUIRED

A photograph or AI demonstration result must never substitute for a biopsy or pathology report.

14. Notifications Collection

Collection: notifications

Purpose: Track reminders and application notifications.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

recipientId

ObjectId

Intended user

notificationType

String

Notification category

title

String

Short notification title

message

String

Notification message

language

String

Telugu or English

relatedRecordId

ObjectId

Related record, if applicable

scheduledAt

Date

Scheduled notification time

sentAt

Date

Delivery timestamp

status

String

Delivery status

createdAt

Date

Creation timestamp

Notifications must avoid exposing sensitive patient information on lock screens or unauthorized devices.

15. AuditLogs Collection

Collection: auditlogs

Purpose: Preserve a history of important application activities.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

actorId

ObjectId

User performing action

action

String

Activity performed

resourceType

String

Type of affected record

resourceId

ObjectId

Affected record ID

timestamp

Date

Activity timestamp

result

String

Success or failure

metadata

Object

Limited additional context

Audit events may include:

LOGIN

LOGOUT

PATIENT_CREATED

PATIENT_VIEWED

SCREENING_CREATED

IMAGE_UPLOADED

AI_ASSESSMENT_CREATED

CLINICAL_REVIEW_UPDATED

APPOINTMENT_CREATED

REFERRAL_CREATED

DIAGNOSTIC_REPORT_UPLOADED

RECORD_EXPORTED

PERMISSION_CHANGED

Audit logs must not store passwords, authentication tokens or unnecessary clinical content.

16. OfflineSyncMetadata Collection

Collection: offlinesyncmetadata

Purpose: Track records created or updated while a device is offline.

Planned fields:

Field

Type

Description

_id

ObjectId

Document ID

deviceReference

String

Application device reference

userId

ObjectId

Associated user

localRecordId

String

Local record identifier

serverRecordId

ObjectId

Server record reference

operationType

String

Create or update

syncStatus

String

Synchronization status

attemptCount

Number

Number of attempts

lastAttemptAt

Date

Last attempt timestamp

syncedAt

Date

Successful synchronization time

errorCode

String

Safe error identifier

createdAt

Date

Creation timestamp

updatedAt

Date

Update timestamp

Planned statuses:

PENDING

SYNCING

SYNCED

FAILED

CONFLICT

The backend must safely handle retries and prevent duplicate record creation.

17. Image and Document Storage Design

Patient photographs, profile images and investigation reports are sensitive assets.

Planned metadata fields:

assetId

storageKey

originalFileName

mimeType

fileSize

checksum

uploadedBy

uploadedAt

relatedRecordId

encryptionStatus

accessClassification

Storage requirements:

Store assets in protected storage.

Keep storage credentials on the backend.

Do not create public clinical-media URLs.

Authorize every image or document access.

Validate file type and size.

Use encrypted transport.

Protect offline files with additional safeguards.

Use synthetic or permitted demonstration images for the hackathon.

The actual image storage provider and implementation will be selected during development.

18. Relationships Between Collections

Important relationships:

One user can have one or more assigned roles only if explicitly supported by the authorization design.

A health worker profile references a user.

A patient can have multiple screening records.

A screening record can have multiple images.

A screening record can have multiple AI demonstration versions over time.

A screening record can have multiple clinical reviews.

A patient can have multiple appointments.

A patient can have multiple referrals.

A referral can be associated with appointments and diagnostics.

A diagnostic record can have a protected report asset.

A user can generate multiple audit log entries.

A user can have multiple notification records.

19. Indexing Plan

Planned indexes:

Collection

Index

Purpose

users

email

Login lookup

users

phone

Login/contact lookup where applicable

users

role

Role-based filtering

patients

patientId

Unique patient lookup

patients

phone

Patient search where permitted

patients

village, mandal, district

Geographic filtering

screeningrecords

patientId, screeningDate

Patient screening history

screeningrecords

status

Screening queue

clinicalreviews

reviewerId, createdAt

Reviewer queue

appointments

appointmentDate, status

Appointment scheduling

referrals

patientId, status

Referral tracking

diagnostics

patientId, reportStatus

Diagnostic follow-up

notifications

recipientId, status

Notification queue

auditlogs

actorId, timestamp

Audit history

Index definitions will be implemented in Mongoose and tested against actual query patterns.

20. Validation and Data Integrity

Backend validation must check:

Required fields.

Valid MongoDB ObjectId references.

Valid role values.

Valid workflow status values.

Valid date formats.

Phone number formats where applicable.

Unique Patient ID.

Valid file metadata.

Consent requirements.

Authorized relationships between users and records.

The frontend must not be treated as the only validation layer.

21. Data Retention and Privacy

The application must follow privacy-by-design principles and consider applicable Indian data-protection requirements.

Planned safeguards:

Collect only necessary information.

Record consent appropriately.

Restrict access by role and care relationship.

Protect sensitive data in transit and at rest.

Maintain access and modification audit trails.

Apply approved retention and deletion policies.

Restrict bulk export.

Use aggregate reporting for district dashboards.

Avoid unnecessary personal information in logs.

Use synthetic records during the hackathon.

Actual retention periods and operational policies must be established with the responsible organization before any real-world deployment.

22. District Dashboard Data

The District Officer dashboard should use aggregate queries for:

Total registered patients.

Total screenings.

Medical Officer reviews.

Suspicious findings requiring clinical review.

Specialist referrals.

Completed and overdue appointments.

Biopsies advised and completed.

Pathology reports pending and received.

Clinician-confirmed outcomes entered in the system.

Treatment linkage.

Missed follow-up cases.

Average review and diagnostic turnaround time.

Filters:

District

Mandal

PHC

Village

Date range

Identifiable patient information must not be displayed by default.

23. Backup and Recovery

Planned operational requirements:

Regular database backups.

Protected backup storage.

Restricted backup access.

Documented restoration procedure.

Periodic restoration testing.

Monitoring for database failures.

Backup frequency and retention must be finalized before deployment.

24. Implementation Status

This document combines implemented schemas and forward-looking design. Sections 4.1 and 4.2 identify implemented models; other designs must not be treated as existing collections or APIs.

A collection should be marked implemented only after:

Its Mongoose schema is created.

Validation rules are implemented.

Indexes are configured.

Related API endpoints are tested.

Authorization rules are verified.

Data persistence is confirmed in MongoDB.

25. Important Clinical Limitation

AAROGYA DRISHTI is a hackathon demonstration platform and is NOT FOR CLINICAL USE.

No real patient records, photographs or clinical consultation recordings should be used in the hackathon demonstration. A real-world pilot requires appropriate authorization, clinical oversight, privacy safeguards and relevant ethics or regulatory review.