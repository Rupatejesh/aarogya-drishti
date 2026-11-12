# AAROGYA DRISHTI — WORKSPACE AUDIT & EXECUTION PLAN

**Project**: AAROGYA DRISHTI — AI-Assisted Oral Cancer Early-Screening & Patient-Care Coordination Platform  
**Programme Context**: AAROHAN Inter-Centre Hackathon 2026 (ITDA Paderu, Alluri Sitharama Raju District, Andhra Pradesh)  
**Technology Stack**: React 19, Vite 8, TypeScript 5.9, Node.js 24, Express 5, MongoDB 8.3, Mongoose 9  

---

## 1. REPOSITORY STRUCTURE REPORT

### 1.1 Directory Inventory
```text
AAROGYA-DRISHTI-MERN-Backup/
├── .gitignore                                  # Root ignore rules
├── README.md                                   # Project overview & 13-phase summary
├── mongod.cfg.backup                           # Backup of Windows MongoDB config
├── docs/
│   ├── API_DOCUMENTATION.md                    # Endpoint contracts
│   ├── DATABASE_DESIGN.md                      # Data architecture & indexing rules
│   ├── DEVELOPMENT_ROADMAP.md                  # Authoritative roadmap (Phase 2A/2B status + Phases 1–15)
│   ├── FRONTEND_IMPLEMENTATION.md              # Frontend architecture & components
│   ├── MASTER_IMPLEMENTATION_PROMPT.md         # Master engineering specifications
│   ├── PROJECT_ARCHITECTURE.md                 # System topology & security boundaries
│   ├── PROJECT_REQUIREMENTS.md                 # Functional & non-functional requirements
│   ├── SECURITY_AND_PRIVACY.md                 # RBAC, consent, CSRF, JWT cookie, audit & k-anonymity rules
│   ├── TESTING_AND_DEMO.md                     # Test strategy & 8-minute hackathon demo script
│   └── WORKSPACE_AUDIT_AND_EXECUTION_PLAN.md   # This audit & execution plan document
├── client/                                     # React 19 + Vite 8 + TypeScript 5.9 SPA
│   ├── .env                                    # Active frontend env (values redacted)
│   ├── .env.example                            # Template: VITE_API_URL=http://localhost:5000/api
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── public/
│   └── src/
│       ├── main.tsx                            # React root mount
│       ├── App.tsx                             # Launch, Gratitude, Role Intro, Auth, Shell & Dashboards
│       ├── App.css                             # Component & layout styles
│       ├── index.css                           # Global theme variables, animations & accessibility modes
│       ├── assets/
│       ├── components/
│       │   ├── BlueUniverse.tsx                # Interactive canvas starfield
│       │   └── PatientWorkflow.tsx             # All 7 role workspaces, forms, timelines & modals
│       ├── data/
│       │   └── platformQuotes.ts               # Bilingual/trilingual quotes
│       ├── i18n/
│       │   ├── language.ts                     # Language types (en, te, hi), storage & speech codes
│       │   └── workflowTranslations.ts         # Active UI & workflow dictionary (en, te, hi)
│       └── services/
│           └── api.ts                          # Axios instance, CSRF interceptor & typed API methods
└── server/                                     # Node.js + Express 5 + Mongoose 9 + TypeScript 5.9 API
    ├── .env                                    # Active backend env (values redacted)
    ├── .env.example                            # Template env variables
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── dist/                                   # Compiled TypeScript output
    ├── scripts/
    │   ├── create-admin.ts                     # Initial admin creation script
    │   └── reset-admin-password.ts             # Env-driven admin password reset script
    ├── src/
    │   ├── server.ts                           # Express app setup, middleware chain, route mounting & HTTP listen
    │   ├── config/
    │   │   ├── cors.ts                         # Allowed origins & CORS options
    │   │   ├── database.ts                     # Mongoose connection & disconnection helpers
    │   │   └── session.ts                      # Auth & CSRF cookie options and cookie parser
    │   ├── controllers/
    │   │   ├── auth.controller.ts
    │   │   ├── clinicalReview.controller.ts
    │   │   ├── diagnostic.controller.ts
    │   │   ├── followUp.controller.ts
    │   │   ├── ownership-claim.controller.ts
    │   │   ├── patient.controller.ts
    │   │   ├── referral.controller.ts
    │   │   ├── report.controller.ts
    │   │   ├── screening.controller.ts
    │   │   └── user.controller.ts
    │   ├── middleware/
    │   │   ├── auth.middleware.ts
    │   │   ├── csrf.middleware.ts
    │   │   ├── rateLimit.middleware.ts
    │   │   └── validate.middleware.ts
    │   ├── models/
    │   │   ├── AuditLog.model.ts
    │   │   ├── ClinicalReview.model.ts
    │   │   ├── Consent.model.ts
    │   │   ├── DiagnosticOrder.model.ts
    │   │   ├── FollowUp.model.ts
    │   │   ├── OwnershipClaim.model.ts
    │   │   ├── Patient.model.ts
    │   │   ├── Referral.model.ts
    │   │   ├── Screening.model.ts
    │   │   ├── User.model.ts
    │   │   └── WorkflowLock.model.ts
    │   ├── routes/
    │   │   ├── aggregate-dashboard.routes.ts
    │   │   ├── auth.routes.ts
    │   │   ├── clinicalReview.routes.ts
    │   │   ├── diagnostic.routes.ts
    │   │   ├── followUp.routes.ts
    │   │   ├── patient.routes.ts
    │   │   ├── referral.routes.ts
    │   │   ├── screening.routes.ts
    │   │   └── user.routes.ts
    │   ├── scripts/
    │   │   ├── create-test-auth-user.ts
    │   │   ├── diagnose-test-auth-user.ts
    │   │   └── reset-admin-password.ts
    │   ├── services/
    │   │   ├── aggregate-dashboard.service.ts
    │   │   ├── audit.service.ts
    │   │   ├── auth.service.ts
    │   │   ├── clinicalReview.service.ts
    │   │   ├── diagnostic.service.ts
    │   │   ├── followUp.service.ts
    │   │   ├── ownership-claim.service.ts
    │   │   ├── patient-access.service.ts
    │   │   ├── patient.service.ts
    │   │   ├── referral.service.ts
    │   │   ├── screening.service.ts
    │   │   ├── user.service.ts
    │   │   └── workflow-lock.service.ts
    │   ├── types/
    │   │   └── auth.types.ts
    │   ├── utils/
    │   │   ├── AppError.ts
    │   │   └── jwt.ts
    │   └── validators/
    └── tests/
        ├── aggregate-dashboard.test.ts
        ├── auth.integration.test.ts
        ├── clinical-workflow.integration.test.ts
        └── patient.integration.test.ts
```

---

## 2. ENVIRONMENT AND CONFIGURATION REPORT

| Component | Verified Value / Status |
| :--- | :--- |
| **Node.js & npm** | Node.js `v24.21.0`, npm `11.19.0` |
| **Frontend Dependencies** | Installed (`client/node_modules` present; React `^19.2.4`, Vite `^8.0.5`, Axios `^1.15.0`, React Router `^7.14.0`, TypeScript `~5.9.3`) |
| **Backend Dependencies** | Installed (`server/node_modules` & `server/dist` present; Express `^5.2.1`, Mongoose `^9.4.1`, Zod `^4.3.6`, JWT `^9.0.3`, bcryptjs `^3.0.3`, Helmet `^8.1.0`, CORS `^2.8.6`, Multer `^2.1.1`, Jest `^30.3.0`, Supertest `^7.2.2`) |
| **Vite & API Base URL** | Vite dev port `5173`; `client/.env` defines `VITE_API_URL` |
| **Express Server Port** | Port `5000` (`process.env.PORT || 5000`) |
| **MongoDB Service Binary** | `C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe` |
| **MongoDB Config File** | `C:\Program Files\MongoDB\Server\8.3\bin\mongod.cfg` (`net.port: 27017`, `net.bindIp: 127.0.0.1`, `replication.replSetName: rs0`) |
| **MongoDB Active `dbPath`** | `C:\Program Files\MongoDB\Server\8.3\data` |
| **MongoDB Log Path** | `C:\Program Files\MongoDB\Server\8.3\log\mongod.log` |
| **CORS Allowed Origins** | `http://localhost:5173`, `http://127.0.0.1:5173` plus `process.env.CORS_ORIGINS` |
| **Session & CSRF Cookies** | `aarogya_session` (`HttpOnly`, `SameSite=Strict`, 8h); `aarogya_csrf` (`SameSite=Lax`, 8h) + `X-CSRF-Token` header |
| **Environment Variable Keys** | `client/.env`: `VITE_API_URL`; `server/.env`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `ADMIN_NAME`, `ADMIN_EMAIL` |

---

## 3. ROOT-CAUSE ANALYSIS: `"Request origin or CSRF token is invalid."`

The error `"Request origin or CSRF token is invalid."` is returned by `csrfProtection` in `server/src/middleware/csrf.middleware.ts` with HTTP `403` when:
`!origin || !allowedOrigins.includes(origin) || !tokensMatch(cookieToken, headerToken)`

### Root Causes Identified:
1. **`localhost` vs `127.0.0.1` Cross-Site Cookie Mismatch**:
   - `client/src/services/api.ts` uses `import.meta.env.VITE_API_URL || http://${localHostname}:5000/api`.
   - When `VITE_API_URL` is hardcoded to `http://localhost:5000/api` in `client/.env` while the browser opens `http://127.0.0.1:5173` (or vice versa), the browser treats `localhost` and `127.0.0.1` as cross-site.
   - `GET /api/auth/csrf` sets `aarogya_csrf` with `SameSite=Lax` and returns `{ csrfToken }` in the JSON body. Axios caches `csrfToken` in memory from the JSON body and sends `X-CSRF-Token` on `POST /api/auth/login`, but the browser withholds the `SameSite=Lax` `aarogya_csrf` cookie on the cross-site `POST` request, causing `cookieToken` to be `undefined` on the server.
2. **Stale In-Memory `csrfToken` Cache Without 403 Retry**:
   - `ensureCsrfToken()` returns the module-level `csrfToken` variable before checking `document.cookie`, and the response error interceptor only clears `csrfToken` on HTTP `401`, not HTTP `403`.

### Fix Strategy (Preserving All Security Protections):
- Rewrite `resolveApiBaseUrl()` in `client/src/services/api.ts` so loopback hostnames (`localhost` / `127.0.0.1`) always synchronize with `window.location.hostname`.
- Always check `readCookie(CSRF_COOKIE_NAME)` first, update in-memory `csrfToken` from the live cookie when present, and automatically refresh `/api/auth/csrf` and retry once on an HTTP `403` CSRF failure.
- Add a `/api` proxy in `client/vite.config.ts` as an additional same-origin option.

---

## 4. FRONTEND & BACKEND INTEGRATION GAPS

| Gap | Backend Status | Frontend Status | Resolution |
| :--- | :--- | :--- | :--- |
| **Specialist Referral Assignment** | `PATCH /api/referrals/:referralId/specialist` exists, but `GET /api/users/specialists` is missing. | `ReferralModal` and `PatientDetailWorkspace` cannot list or assign a `SPECIALIST`. Because `SPECIALIST` RBAC requires `assignedSpecialist == user._id`, the Specialist workspace is unreachable via UI. | Add `GET /api/users/specialists` for `MEDICAL_OFFICER` & wire Specialist assignment in `ReferralModal` and `PatientDetailWorkspace`. |
| **Patient Ownership Claim & Account Linking** | `POST /api/patients/:id/ownership-claims` (`MEDICAL_OFFICER`) and `POST /api/patients/:id/link-account` (`PATIENT`) are implemented. | Neither endpoint exists in `client/src/services/api.ts` or `PatientWorkflow.tsx`. | Add both functions to `api.ts`, add "Issue Patient Claim Code" to the MO patient workspace, and add "Link Clinical Record" to `PatientSelfPortal`. |
| **Duplicate Patient Registration (`409`)** | `POST /api/patients` returns `409` with `data.possibleDuplicates`. | `PatientRegistrationForm` only renders the error string, hiding the candidate matches. | Render the `possibleDuplicates` list in `PatientRegistrationForm` with a direct action to open an existing matched patient record. |
| **Stale Workflow Lock Risk** | `WorkflowLock.model.ts` locks a patient during clinical mutations but has no TTL expiration index. | Returns `409 Conflict` if a lock is orphaned by a crash. | Add `expiresAt` with a MongoDB TTL index (`expireAfterSeconds: 0`, 60-second lease) and cleanup of expired locks in `workflow-lock.service.ts`. |

---

## 5. PHASE 1–15 ROADMAP & FEATURE STATUS MATRIX

| Phase (`DEVELOPMENT_ROADMAP.md`) | `README.md` (13-Phase Map) | Status | Remaining Priority Work |
| :--- | :--- | :--- | :--- |
| **Phase 1 — Project Foundation** | Phase 1 | **Implemented** | Initialize `.git` if desired; keep workspace clean. |
| **Phase 2 — Database & Backend Foundation** | Phase 1 | **Implemented** | Add TTL expiry to `WorkflowLock.model.ts`. |
| **Phase 3 — Authentication & Role-Based Access** | Phase 2 | **Implemented** | Fix CSRF hostname synchronization & 403 retry in `client/src/services/api.ts`. |
| **Phase 4 — Frontend Design & Navigation** | Phase 12 | **Implemented** | Preserve launch, Gratitude, Blue Universe, and 7-role workspaces. |
| **Phase 5 — Patient Registration & Health Worker Workflow** | Phase 3 & 4 | **Implemented** | Render `possibleDuplicates` on 409 registration conflict; wire Ownership Claim UI. |
| **Phase 6 — AI-Assisted Demonstration Screening** | Phase 4 & 5 | **Planned (Phase 2B)** | Oral photo upload (`IMAGE_CAPTURE` consent gated), SHA-256 hash, quality check & `AIScreeningAdapter`. |
| **Phase 7 — Medical Officer & Specialist Portal** | Phase 6 | **Partially Implemented** | Add `GET /api/users/specialists` & wire Specialist assignment on referrals. |
| **Phase 8 — Appointments, Referrals & Diagnostics** | Phase 7 & 9 | **Partially Implemented** | Referrals & Diagnostics complete; Appointment scheduling model/routes/UI to be added. |
| **Phase 9 — Telemedicine Demonstration** | Phase 8 | **Planned** | Telemedicine consultation session & notes workflow linked to Appointments. |
| **Phase 10 — Patient Timeline & Follow-Up** | Phase 9 | **Implemented** | Wire Patient account linking UI so `PATIENT` role can view `CareTimeline`. |
| **Phase 11 — Offline Support & Synchronization** | Phase 11 | **Planned** | Browser offline draft queue & one-click sync for ASHA workers. |
| **Phase 12 — SAMMAKKA Assistant** | Phase 12 | **Partially Implemented** | Upgrade `SammakkaPreviewCard` into an interactive multilingual Q&A/workflow guide. |
| **Phase 13 — District Officer Dashboard** | Phase 10 | **Implemented** | Anonymized monthly aggregate report & mandal breakdown (`k >= 5` suppression) complete. |
| **Phase 14 — Security, Testing & QA** | Phase 13 | **Implemented** | Run & expand backend integration tests and frontend build checks. |
| **Phase 15 — Deployment & Hackathon Submission** | Phase 13 | **In Progress** | Create comprehensive demo seed script (`seed:demo`) for all 7 roles and sample patient journeys. |

---

## 6. PRIORITIZED EXECUTION SEQUENCE

1. **Step 1 (Critical Path — Auth & CSRF Fix + Lock Resilience)**:
   - Fix `client/src/services/api.ts` loopback hostname alignment and automatic 403 CSRF token refresh/retry.
   - Add TTL lease expiration to `server/src/models/WorkflowLock.model.ts` and `server/src/services/workflow-lock.service.ts`.
2. **Step 2 (Critical Path — Complete Phase 2 Clinical & Portal Wiring)**:
   - Add `GET /api/users/specialists` in `server/src/services/user.service.ts`, `user.controller.ts`, and `user.routes.ts`.
   - Wire Specialist assignment (`assignReferralSpecialist` & `assignedSpecialistId` selection) in `client/src/services/api.ts` and `client/src/components/PatientWorkflow.tsx`.
   - Wire Patient Ownership Claim generation (`POST /api/patients/:id/ownership-claims`) for `MEDICAL_OFFICER` and Patient Account Linking (`POST /api/patients/:id/link-account`) in `PatientSelfPortal`.
   - Render `possibleDuplicates` candidates in `PatientRegistrationForm` when `POST /api/patients` returns HTTP `409`.
3. **Step 3 (Phase 6 — Oral Photo Provenance, Quality Check & AI Screening Demo Adapter)**:
   - Extend `Screening` model, validator, service, and UI to support optional `IMAGE_CAPTURE`-consented oral cavity photo metadata, SHA-256 integrity hash, automated image quality checks, and a clearly labeled `DEMO_ONLY` AI risk/uncertainty screening adapter with mandatory clinician override/review.
4. **Step 4 (Phases 8 & 9 — Appointments & Telemedicine Consultation Coordination)**:
   - Implement `Appointment` model, routes, and UI for scheduling clinic/telemedicine consultations, recording consultation notes, and launching low-bandwidth telemedicine sessions.
5. **Step 5 (Phases 11 & 12 — Interactive SAMMAKKA Assistant & Offline Draft Queue)**:
   - Upgrade SAMMAKKA into an interactive multilingual (`EN`/`TE`/`HI`) voice-enabled assistant and add offline draft queueing for ASHA workers.
6. **Step 6 (Phases 14 & 15 — Verification, Integration Tests & Hackathon Demo Seed)**:
   - Build a complete demo seed script (`server/src/scripts/seed-demo-data.ts`), verify TypeScript builds on both `client/` and `server/`, and verify backend integration tests.

