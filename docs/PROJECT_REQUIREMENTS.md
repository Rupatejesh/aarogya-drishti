# AAROGYA DRISHTI – Project Requirements

**Document Version:** 1.0  
**Status:** Planning  
**Project Type:** AI-Assisted Oral Cancer Early-Screening and Patient-Care Management Platform  
**Primary Technology:** MERN Stack

---

## 1. Project Overview

AAROGYA DRISHTI is a digital healthcare platform designed to support oral cancer early-screening workflows and patient-care coordination.

The platform connects patients, ASHA workers, Medical Officers, specialists, diagnostic facilities and district administrators.

It aims to support patient registration, oral screening documentation, image quality assessment, AI-assisted demonstration screening, clinical review, telemedicine, referrals, diagnostic tracking, patient follow-up and district-level programme monitoring.

The system is intended to support healthcare professionals. It does not replace professional medical examination or clinical decision-making.

### 1.1 Project Objectives

- Enable digital patient registration.
- Support guided oral screening documentation.
- Provide secure photographic documentation.
- Integrate a clearly labelled AI demonstration module.
- Enable Medical Officer and specialist review.
- Support appointments and referrals.
- Track diagnostic investigations and reports.
- Maintain longitudinal patient records.
- Support patient navigation and follow-up.
- Provide aggregate district-level monitoring.
- Support Telugu and English workflows.
- Protect patient privacy and information.

---

## 2. Requirement Classification

Requirements are divided into two categories.

### Category A – Official Hackathon Requirements

These are based on the official AAROGYA DRISHTI hackathon problem statement.

### Category B – Additional Project Enhancements

These are additional features requested for this project. They complement the official requirements and do not replace mandatory functionality.

---

# PART A – OFFICIAL HACKATHON REQUIREMENTS

## 3. User Roles and Access

The system must support the following roles:

### 3.1 Patient

- View permitted personal profile information.
- View appointments and referrals.
- View permitted screening and follow-up information.
- Receive non-sensitive notifications.
- Access information in Telugu or English.

### 3.2 ASHA Worker

- Register patients.
- Record patient consent and relevant history.
- Conduct and document screening workflows.
- Capture guided oral photographs.
- Save permitted information offline.
- Synchronize pending records.
- Track assigned patient follow-up.

### 3.3 Medical Officer

- Access authorized screening cases.
- Review patient history and screening photographs.
- View AI advisory outputs and limitations.
- Record clinical observations.
- Agree, disagree or defer AI advisory findings.
- Request image recapture.
- Record clinical decisions.
- Initiate referrals when required.

### 3.4 Specialist

- Review authorized referrals.
- Conduct specialist consultations.
- Record specialist observations.
- Recommend clinically appropriate investigations.
- Record next steps and follow-up requirements.

### 3.5 District Officer

- View aggregate programme statistics.
- Monitor screening and referral progress.
- Filter reports by district, mandal, village and PHC.
- Monitor pending and overdue cases.
- Review authorized staff workload summaries.

Identifiable patient records must not be available by default to district administrators.

### 3.6 Administrator

- Manage user accounts.
- Configure roles and permissions.
- Manage facilities and application settings.
- Review appropriate security and audit information.

Administrative access must follow least-privilege principles.

---

## 4. Patient Registration

The system must support:

- Unique generated Patient ID.
- Patient personal details.
- Contact information.
- Village or habitation.
- Gram Panchayat.
- Mandal.
- PHC.
- Tobacco and relevant exposure history.
- Symptoms and duration.
- Previous screening history.
- Previous referrals.
- Consent documentation.
- Duplicate patient detection.

Aadhaar must not be mandatory for registration.

---

## 5. Oral Screening and Image Capture

The screening module must support:

- Guided oral examination documentation.
- Tongue photographs.
- Inner cheek photographs.
- Palate photographs.
- Gum photographs.
- Floor-of-mouth photographs.
- Camera preview.
- Image recapture.
- Body-site annotation.
- Image framing guidance.
- Lighting guidance.
- Blur detection.
- Darkness and glare checks.
- Secure image linkage to patient records.
- Offline image saving.
- Safe synchronization.

Photographs supplement clinical examination and do not replace a complete examination by a qualified professional.

---

## 6. AI-Assisted Screening

The system must provide a modular AI integration interface.

Required functionality:

- Image quality assessment.
- Structured advisory findings.
- Transparent demonstration inference.
- Image-related visual output when genuinely supported.
- Model version tracking.
- Model provenance.
- AI limitations.
- Timestamped results.
- Review history.
- Medical Officer override.

### Demonstration states

1. Image quality insufficient.
2. Suspicious finding requiring clinical review.
3. No suspicious finding identified by the demonstration model.

AI must never be presented as a definitive cancer diagnosis.

A mock or research model must be labelled:

**NOT FOR CLINICAL USE**

AI advisory output and signed clinical conclusions must remain separate.

---

## 7. Medical Officer and Specialist Portal

The portal must provide:

- Secure review queue.
- Authorized patient history.
- Screening photographs.
- Image zoom and inspection.
- AI advisory information.
- Clinical observations.
- Clinical decisions.
- Image recapture requests.
- Referral reason.
- Timestamped notes.
- Specialist review.
- Specialist observations.
- Separate specialist documentation.

The Medical Officer and specialist retain responsibility for their clinical decisions.

---

## 8. Telemedicine

The telemedicine module must support:

- Specialist consultation requests.
- Appointment slot availability.
- Booking.
- Rescheduling.
- Cancellation.
- Secure time-limited meeting links.
- Audio and video communication.
- Access restrictions.
- Consultation notes.
- Consultation outcomes.
- Next-action documentation.
- Notifications without sensitive patient details.

Video recording must be disabled by default.

A real deployment must undergo appropriate security, privacy and regulatory review.

---

## 9. Appointment and Referral Management

The system must support:

- Referral creation.
- Referral specialty.
- Hospital or facility selection.
- Referral reason.
- Referral priority.
- Appointment confirmation.
- Rescheduling.
- Attendance tracking.
- Missed appointment reasons.
- Reminder notifications.
- Referral completion tracking.
- Navigator escalation.
- Telugu and English referral slips.

---

## 10. Diagnostics and Treatment Tracking

The system must track clinically directed investigations such as:

- Specialist re-examination.
- Biopsy.
- Histopathology.
- CT when clinically indicated.
- MRI when clinically indicated.

Investigation statuses must include:

1. Advised.
2. Scheduled.
3. Performed.
4. Sample collected.
5. Report pending.
6. Report received.
7. Clinician reviewed.
8. Next action recorded.

The system must distinguish between:

- Screening-positive findings.
- Clinical suspicion.
- Clinician-recorded precancerous conditions.
- Pathology-confirmed malignancy.

An image or AI result must never substitute for biopsy or pathology confirmation.

---

## 11. Longitudinal Patient Record Management

Each authorized patient record must support a chronological history of:

- Registration.
- Consent.
- Screening.
- Photographs.
- AI advisory history.
- Clinical review notes.
- Telemedicine consultations.
- Referrals.
- Investigations.
- Diagnostic reports.
- Clinician-entered diagnosis.
- Treatment linkage.
- Follow-up.
- Missed appointments.

Material changes must preserve user identity, timestamp and version information through appropriate audit records.

---

## 12. Patient Navigation and Follow-up

The system must support:

- Navigator assignment.
- Patient follow-up tasks.
- Contact attempts.
- Transport-support coordination records where applicable.
- Reminder notifications.
- Missed appointment tracking.
- Overdue case escalation.
- Follow-up completion.
- Treatment initiation tracking.

---

## 13. District Officer Dashboard

The dashboard must display aggregate programme indicators.

### 13.1 Screening Overview

- Total registered patients.
- Total screenings.
- Medical Officer reviews.
- Suspicious findings requiring clinical review.
- Specialist referrals.
- Completed appointments.
- Overdue appointments.

### 13.2 Diagnostics Overview

- Biopsies advised.
- Biopsies completed.
- Pathology reports pending.
- Pathology reports received.
- Clinician-confirmed precancers.
- Pathology-confirmed cancers.
- Treatment linkage.
- Loss to follow-up.

### 13.3 Performance Indicators

- Average time to Medical Officer review.
- Average time to diagnosis.
- Referral completion rate.
- Pending-case summaries.
- Follow-up completion.

### 13.4 Filters

- District.
- Mandal.
- Village.
- PHC.

### 13.5 Reporting

- Aggregate report generation.
- Programme summaries.
- Authorized data export.
- Staff activity and workload summaries.

Identifiable patient information must remain restricted by default.

---

## 14. Language and Accessibility

The system must provide:

- Telugu interface.
- English interface.
- Essential workflow translations.
- One-touch language switching.
- Large buttons.
- Clear icons.
- Simple navigation.
- Minimal typing.
- Telugu error messages.
- Budget Android device compatibility.
- Accessible touch targets.

Hindi may be considered as a future enhancement but is not a substitute for the mandatory Telugu and English workflows.

---

## 15. Security and Privacy

The application must implement:

- Individual accounts.
- Role-based access control.
- Least-privilege access.
- Strong session management.
- MFA for privileged users.
- No shared accounts.
- Authorized patient record access.
- HTTPS/TLS.
- Encryption of sensitive data at rest.
- Secure image and document storage.
- Protected offline data.
- Secure backup and recovery.
- Audit logging.
- Access and edit tracking.
- Export restrictions.
- Consent management.
- Privacy-by-design.
- Indian DPDP compliance planning.

Public clinical-media links must not be used.

---

## 16. Hackathon Demonstration Requirements

The hackathon demonstration must use synthetic patient information and permitted educational images.

The compulsory demonstration scenario includes:

- A synthetic 46-year-old patient from G. Madugula.
- Persistent white cheek patch.
- Tobacco-chewing history.
- Registration in Telugu.
- Guided oral photograph capture.
- Image quality assessment.
- Clearly labelled demonstration AI result.
- Medical Officer review.
- Secure specialist video consultation.
- Physical appointment when required.
- Biopsy order.
- Simulated pathology report.
- Authorized clinician-recorded simulated result.
- Longitudinal patient record.
- Navigator follow-up.
- District dashboard.

### Jury testing scenarios

- Telugu and English switching.
- Offline registration and synchronization.
- Unauthorized access prevention.
- Poor image handling.
- Medical Officer AI override.
- Missed appointment handling.
- Network failure and recovery.
- Separation of AI output and clinical diagnosis.

---

# PART B – ADDITIONAL PROJECT ENHANCEMENTS

## 17. SAMMAKKA – 3D Virtual Assistant

SAMMAKKA is our original friendly 3D tribal-girl virtual assistant.

### Planned features

- Floating assistant button on application pages.
- Friendly 3D character design.
- Telugu and English conversations.
- Application usage instructions.
- Patient registration guidance.
- Photo capture guidance.
- Appointment guidance.
- Referral guidance.
- Troubleshooting.
- Curated FAQ knowledge base.
- Future AI API integration through Node.js.

### Safety restrictions

- No medical diagnosis.
- No treatment recommendations.
- No replacement of doctors.
- Medical questions must be directed to qualified healthcare professionals.

## 18. Individual User Profile Photos

Each user type will have an individual profile image or avatar.

Supported roles:

- Patient.
- ASHA Worker.
- Medical Officer.
- Specialist.
- District Officer.
- Administrator.

Planned profile information:

- Display name.
- Role.
- Profile image.
- Authorized contact details.
- Account information.
- Relevant role-specific details.

Patient health information must remain protected by access controls and consent.

Hackathon demonstrations will use synthetic profiles and permitted images.

## 19. Enhanced District Officer Dashboard

Additional planned features:

- Animated statistics.
- Interactive charts.
- Staff activity summaries.
- Staff workload summaries.
- Pending-case summaries.
- Geographic programme summaries.
- Downloadable aggregate reports.
- Responsive dashboard interface.

These features must follow the official privacy requirement of aggregate reporting by default.

## 20. Immersive UI Design

The application will use an original Active Theory-inspired design approach.

Planned elements:

- Deep navy and charcoal theme.
- Gradient backgrounds.
- Subtle glowing elements.
- Smooth transitions.
- Interactive cards.
- Animated counters.
- Modern sidebar.
- Responsive layouts.
- Friendly character presentation.
- Accessible typography.

The design must remain usable on budget Android devices and must not sacrifice accessibility for animation.

---

# PART C – TECHNICAL AND DELIVERY REQUIREMENTS

## 21. Fixed Technology Decisions

The project will use:

- MongoDB Community Edition.
- Mongoose.
- Express.js.
- Node.js.
- React.
- Vite.
- TypeScript.
- React Router.
- Axios.

Offline support will use browser storage with additional data-protection measures.

AI integration will use JavaScript/TypeScript-compatible components.

No Python-based AI service or PostgreSQL primary database will be introduced.

## 22. Functional Acceptance Criteria

The application will be considered functionally ready for the hackathon demonstration only when:

- User authentication works.
- Role-based permissions are enforced by the backend.
- Patient registration persists in MongoDB.
- Screening records are saved correctly.
- Permitted photographs can be uploaded and retrieved securely.
- Poor-quality images are handled appropriately.
- AI demonstration output is clearly labelled.
- Medical Officer review is recorded separately.
- Specialist consultation can be demonstrated.
- Appointments and referrals can be tracked.
- Simulated diagnostics can be recorded.
- Patient history is available as a timeline.
- Offline capture and synchronization are demonstrated.
- Telugu and English workflows work.
- SAMMAKKA application guidance works.
- District statistics are calculated from actual stored data.
- Audit events are recorded.
- Unauthorized access is blocked.

## 23. Final Submission Requirements

The final hackathon submission should include:

1. Version-controlled source repository.
2. Working application build.
3. Deployed or accessible demonstration.
4. Evaluator accounts.
5. System architecture.
6. Database design.
7. API documentation.
8. Installation guide.
9. Deployment guide.
10. AI model provenance and limitations.
11. Synthetic demonstration dataset and reset procedure.
12. Security and privacy documentation.
13. Role and permission matrix.
14. Testing report.
15. Offline and failure-handling test results.
16. Telugu UI demonstration.
17. Five-minute product demonstration.
18. Future clinical-pilot roadmap.

## 24. Important Clinical and Ethical Restrictions

- Competition demonstrations must use synthetic records.
- Do not use real patient records or clinical photographs.
- Do not present demonstration AI as clinically validated.
- Do not claim that a patient is cancer-free based on AI output.
- Do not provide real-world diagnosis or treatment through the demo.
- Clinical deployment requires appropriate authorization, ethics and regulatory permissions, clinical protocols and independent security review.

---

## 25. Document Status

This document describes project requirements and planned acceptance criteria.

It does not claim that the listed features are already implemented.

Requirements will be tracked through development, testing and demonstration.

**Document:** PROJECT_REQUIREMENTS.md  
**Version:** 1.0  
**Status:** Initial requirements specification.