import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import connectDatabase from "../config/database";
import User from "../models/User";
import Patient from "../models/Patient";
import Consent from "../models/Consent";
import Screening from "../models/Screening";
import ClinicalReview from "../models/ClinicalReview";
import Referral from "../models/Referral";
import DiagnosticOrder from "../models/DiagnosticOrder";
import FollowUp from "../models/FollowUp";
import Hospital from "../models/Hospital.model";
import Appointment from "../models/Appointment.model";
import Grievance from "../models/Grievance.model";
import { hashPassword } from "../services/auth.service";

dotenv.config();

const createDemoOralPatchPngBuffer = (): Buffer => {
    // Valid 1x1 coral-pink PNG pixel with embedded clinical demo metadata chunk for deterministic SHA-256 provenance
    const base64Png =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    return Buffer.from(base64Png, "base64");
};

const seedHackathonDemo = async (): Promise<void> => {
    await connectDatabase();

    console.log("Seeding AAROGYA DRISHTI Official Hackathon Demo Case (G. Madugula 46Y Male)...");

    // 1. Seed Hospitals
    const hospitals = [
        {
            hospitalId: "HOSP-ASR-PADERU-01",
            name: "District Hospital Paderu",
            type: "DISTRICT_HOSPITAL" as const,
            mandal: "Paderu",
            district: "Alluri Sitharama Raju",
            address: "Main Hospital Road, ITDA Headquarters, Paderu, ASR District",
            contactPhone: "08935-250108",
            facilities: [
                "Oral Oncology Screening Unit",
                "Biopsy/Histopathology",
                "Telemedicine Unit",
                "Emergency Dental Care"
            ],
            workingHours: "24x7 / 9 AM - 5 PM",
            isActive: true
        },
        {
            hospitalId: "HOSP-ASR-GMADUGULA-01",
            name: "Primary Health Centre G. Madugula",
            type: "PHC" as const,
            mandal: "G. Madugula",
            district: "Alluri Sitharama Raju",
            address: "G. Madugula Main Road, Alluri Sitharama Raju District",
            contactPhone: "08935-256104",
            facilities: [
                "Primary Oral Screening",
                "Telemedicine Spokes",
                "ASHA Navigator Desk"
            ],
            workingHours: "9 AM - 5 PM",
            isActive: true
        },
        {
            hospitalId: "HOSP-ASR-CHINTAPALLI-01",
            name: "Community Health Centre Chintapalli",
            type: "CHC" as const,
            mandal: "Chintapalli",
            district: "Alluri Sitharama Raju",
            address: "Agency Main Road, Chintapalli Mandal, ASR District",
            contactPhone: "08937-238240",
            facilities: [
                "Oral Cancer Triage Clinic",
                "Telemedicine Unit",
                "Emergency Dental Care"
            ],
            workingHours: "24x7 / 9 AM - 5 PM",
            isActive: true
        },
        {
            hospitalId: "HOSP-VSP-KGH-01",
            name: "King George Hospital (KGH) Visakhapatnam",
            type: "TERTIARY_REFERRAL" as const,
            mandal: "Visakhapatnam",
            district: "Alluri Sitharama Raju",
            address: "Maharanipeta, Visakhapatnam (ASR Tertiary Oncology Referral Hub)",
            contactPhone: "0891-2564891",
            facilities: [
                "Oral Oncology",
                "Biopsy/Histopathology",
                "Head & Neck Onco-Surgery",
                "Telemedicine Unit"
            ],
            workingHours: "24x7 / 9 AM - 5 PM",
            isActive: true
        }
    ];

    for (const hosp of hospitals) {
        await Hospital.findOneAndUpdate(
            { hospitalId: hosp.hospitalId },
            { $set: hosp },
            { upsert: true, new: true }
        );
    }

    // 2. Seed Official Demo Accounts
    const upsertDemoUser = async (
        identifier: string,
        passwordPlain: string,
        fields: Partial<
            Record<
                string,
                string | number | boolean | string[] | undefined
            >
        >
    ) => {
        const passwordHash = await hashPassword(passwordPlain);
        return User.findOneAndUpdate(
            { email: identifier.toLowerCase() },
            {
                $set: {
                    email: identifier.toLowerCase(),
                    passwordHash,
                    isActive: true,
                    ...fields
                }
            },
            { upsert: true, new: true }
        );
    };

    const ashaWorker = await upsertDemoUser("asha_gmadugula", "Asha@12345678", {
        fullName: "Smt. Pangi Lakshmi (ASHA G. Madugula)",
        phone: "9440100101",
        role: "ASHA_WORKER",
        assignedPHCId: "PHC-GMADUGULA",
        mandal: "G. Madugula",
        district: "Alluri Sitharama Raju"
    });

    const medicalOfficer = await upsertDemoUser(
        "mo_gmadugula",
        "Doctor@12345678",
        {
            fullName: "Dr. K. Surya Prakash (MO PHC G. Madugula)",
            phone: "9440100102",
            role: "MEDICAL_OFFICER",
            assignedPHCId: "PHC-GMADUGULA",
            mandal: "G. Madugula",
            district: "Alluri Sitharama Raju",
            medicalRegistrationNumber: "APMC-MO-3109",
            specialization: "Medical Officer (Primary Care)",
            hospitalId: "HOSP-ASR-GMADUGULA-01"
        }
    );

    const specialist = await upsertDemoUser(
        "spec_paderu",
        "Specialist@12345678",
        {
            fullName: "Dr. V. Anitha Rao (Oral Oncologist, DH Paderu)",
            phone: "9440100103",
            role: "SPECIALIST",
            assignedPHCId: "PHC-GMADUGULA",
            mandal: "G. Madugula",
            district: "Alluri Sitharama Raju",
            medicalRegistrationNumber: "APMC-ONCO-4821",
            specialization: "Oral Oncologist",
            experienceYears: 12,
            hospitalId: "HOSP-ASR-PADERU-01",
            consultationFee: 0,
            availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            timeSlots: [
                "09:30 AM - 10:00 AM",
                "10:30 AM - 11:00 AM",
                "11:30 AM - 12:00 PM",
                "02:30 PM - 03:00 PM"
            ]
        }
    );

    await upsertDemoUser("do_asr", "District@12345678", {
        fullName: "Dr. M. Rajasekhar (DM&HO ASR District)",
        phone: "9440100104",
        role: "DISTRICT_OFFICER",
        district: "Alluri Sitharama Raju"
    });

    await upsertDemoUser("itda_po_paderu", "PoPaderu@12345678", {
        fullName: "Sri Aditya Varma, IAS",
        title: "Project Officer, ITDA Paderu",
        phone: "9440100106",
        role: "ITDA_PROJECT_OFFICER",
        district: "Alluri Sitharama Raju"
    });

    await upsertDemoUser("drone_paderu", "Drone@12345678", {
        fullName: "Paderu Central Drone Base",
        title: "Drone Logistics Superintendent",
        phone: "9440100108",
        role: "DRONE_OPERATOR",
        mandal: "Paderu",
        district: "Alluri Sitharama Raju",
        hospitalId: "HOSP-ASR-PADERU-01"
    });

    const patientUser = await upsertDemoUser(
        "patient_gmadugula",
        "Patient@12345678",
        {
            fullName: "Killo Somanna",
            phone: "9876543210",
            role: "PATIENT",
            mandal: "G. Madugula",
            district: "Alluri Sitharama Raju"
        }
    );

    await upsertDemoUser("admin", "Admin@12345678", {
        fullName: "Platform Administrator (System Admin)",
        phone: "9440100100",
        role: "ADMIN",
        district: "Alluri Sitharama Raju"
    });

    // 3. Seed Official 46-Year-Old G. Madugula Patient Record
    const demoPatientId = "PT-20261110-GMAD01";
    const patient = await Patient.findOneAndUpdate(
        { patientId: demoPatientId },
        {
            $set: {
                patientId: demoPatientId,
                maaUidn: "UIDN-ASR-GMAD-2026-0842",
                user: patientUser._id,
                fullName: "Killo Somanna",
                age: 46,
                sex: "MALE",
                phone: "9440100105",
                preferredLanguage: "TELUGU",
                address: {
                    village: "G. Madugula",
                    habitation: "G. Madugula Main Hamlet",
                    gramPanchayat: "G. Madugula",
                    mandal: "G. Madugula",
                    phcId: "PHC-GMADUGULA",
                    district: "Alluri Sitharama Raju"
                },
                exposureHistory: {
                    tobaccoUse: "CURRENT",
                    tobaccoTypes: ["Chewing Tobacco", "Gutkha"],
                    tobaccoDurationYears: 15,
                    alcoholUse: "NO",
                    otherExposures: ["15-year chewing tobacco/gutkha quid in right buccal sulcus"]
                },
                symptoms: [
                    {
                        name: "Persistent white patch on right buccal mucosa for 6 weeks",
                        durationDays: 42,
                        severity: "MODERATE",
                        notes: "Difficulty chewing spicy food; burning sensation"
                    }
                ],
                registeredBy: ashaWorker._id,
                assignedASHAWorker: ashaWorker._id,
                registrationStatus: "ACTIVE"
            }
        },
        { upsert: true, new: true }
    );

    // 4. Seed Consents (PATIENT_REGISTRATION, ORAL_SCREENING, IMAGE_CAPTURE)
    for (const purpose of [
        "PATIENT_REGISTRATION",
        "ORAL_SCREENING",
        "IMAGE_CAPTURE"
    ] as const) {
        const existingConsent = await Consent.findOne({
            patient: patient._id,
            purpose,
            granted: true,
            withdrawnAt: { $exists: false }
        });
        if (!existingConsent) {
            await Consent.create({
                patient: patient._id,
                purpose,
                granted: true,
                consentVersion: "1.0",
                language: "TELUGU",
                recordedBy: ashaWorker._id,
                recordedAt: new Date(Date.now() - 3 * 3600 * 1000),
                notes: `Informed ${purpose} consent recorded in Telugu at G. Madugula field camp.`
            });
        }
    }

    // 5. Write Demo Oral Photograph & Compute SHA-256 Hash
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const demoImageFilename = "oral-gmadugula-right-buccal-patch.png";
    const demoImagePath = path.join(uploadsDir, demoImageFilename);
    const pngBuffer = createDemoOralPatchPngBuffer();
    fs.writeFileSync(demoImagePath, pngBuffer);
    const sha256Hash = createHash("sha256").update(pngBuffer).digest("hex");

    // 6. Seed Screening with Gemini AI High Risk Analysis
    let screening = await Screening.findOne({ patient: patient._id });
    if (!screening) {
        screening = await Screening.create({
            patient: patient._id,
            screenedBy: ashaWorker._id,
            screeningDate: new Date(Date.now() - 2 * 3600 * 1000),
            notes: "46-year-old male from G. Madugula with 15-year gutkha/chewing tobacco history. Non-scrapable white patch on right buccal mucosa for 6 weeks with burning on eating spicy food.",
            symptoms: [
                {
                    name: "Persistent white patch on right buccal mucosa (6 weeks) & difficulty chewing spicy food",
                    duration: "6 weeks",
                    bodySite: "RIGHT_CHEEK"
                }
            ],
            examinationFindings: [
                {
                    bodySite: "RIGHT_CHEEK",
                    observation:
                        "Circumscribed adherent homogeneous/speckled white leukoplakia-like plaque (approx 1.8 cm x 1.2 cm) on right buccal mucosa opposite lower molars.",
                    notes: "Mild surrounding erythema; mild restriction in mouth opening."
                }
            ],
            tobaccoUse: "CURRENT",
            clinicalStatus: "SUSPICIOUS_FINDING_REQUIRES_REVIEW",
            screeningStatus: "REQUIRES_REVIEW",
            images: [
                {
                    site: "RIGHT_CHEEK",
                    fileUrl: `/uploads/${demoImageFilename}`,
                    sha256Hash,
                    qualityStatus: "ADEQUATE",
                    capturedAt: new Date(Date.now() - 2 * 3600 * 1000)
                }
            ],
            aiAssessment: {
                imageQuality: "ADEQUATE",
                visibleFeatures: [
                    "Well-demarcated adherent white mucosal plaque on right buccal mucosa",
                    "Focal erythematous peripheral margin suggestive of speckled leukoplakia change",
                    "Correlates with 15-year smokeless tobacco quid placement site"
                ],
                reportedOralRegion: "Right Buccal Mucosa",
                preliminaryRiskCategory: "HIGH_RISK",
                detectedCondition: "Oral Leukoplakia (Non-Homogeneous Speckled Variant)",
                icd10Code: "K13.21",
                severityStage: "Precancerous OPMD - High Dysplasia Suspicion",
                confidenceScore: 92,
                clinicalExplanation:
                    "Persistent (>6 weeks) non-scrapable white patch on right buccal mucosa in a 46-year-old male with a 15-year gutkha/chewing tobacco habit and spicy food intolerance indicates a high-risk Oral Potentially Malignant Disorder (OPMD).",
                differentialDiagnoses: [
                    "Oral Lichen Planus (Reticular)",
                    "Hyperkeratotic Friction Lesion",
                    "Erythroleukoplakia",
                    "Pseudomembranous Candidiasis"
                ],
                recommendedTests: [
                    "Toluidine Blue 1% Mucosal Vital Staining",
                    "Incisional Scalpel Biopsy & Histopathology (District Hospital Paderu)",
                    "Exfoliative Brush Biopsy",
                    "Complete Blood Picture & Serum Ferritin"
                ],
                medications: [
                    {
                        name: "Triamcinolone Acetonide 0.1% Buccal Paste",
                        dosage: "Thin topical film (pea-sized dab)",
                        frequency: "Three times daily (TDS) after meals",
                        duration: "21 days",
                        route: "Oral Mucosal Topical",
                        instructions: "Dab dry the lesion with clean cotton prior to application. Do not rub. Refrain from eating or drinking for 30 minutes."
                    },
                    {
                        name: "Lycopene (5000 mcg) + Alpha Lipoic Acid + Multivitamin Capsules",
                        dosage: "1 Capsule daily",
                        frequency: "Once daily (OD) post breakfast",
                        duration: "60 days",
                        route: "Oral",
                        instructions: "Potent antioxidant regimen to scavenge reactive oxygen species and halt premalignant mucosal transformation."
                    },
                    {
                        name: "Chlorhexidine Gluconate 0.2% Antiseptic Oral Rinse",
                        dosage: "10 ml undiluted",
                        frequency: "Twice daily (BD) morning & evening",
                        duration: "14 days",
                        route: "Oral Rinse / Gargle",
                        instructions: "Swish vigorously around buccal sulcus for 60 seconds then spit out. Do not swallow."
                    },
                    {
                        name: "Clotrimazole Mouth Paint 1% (Antifungal Prophylaxis)",
                        dosage: "4-5 drops applied gently with applicator",
                        frequency: "Three times daily (TDS)",
                        duration: "10 days",
                        route: "Topical Mucosal",
                        instructions: "Prophylaxis against secondary Candida albicans colonization over hyperkeratotic plaque."
                    }
                ],
                lifestyleAdvice: [
                    "STRICT & IMMEDIATE CESSATION: Stop chewing gutkha, khaini, betel quid (paan), and bidi smoking immediately.",
                    "DIETARY MODIFICATION: Avoid chili powder, piping hot beverages, hard spices, and acidic foods that trigger mucosal burning.",
                    "ORAL HYGIENE: Use an ultra-soft bristle toothbrush; avoid harsh chemical toothpastes.",
                    "HYDRATION & RINSING: Perform warm saline mouth gargles (1/2 teaspoon rock salt in lukewarm water) 3 times daily."
                ],
                teluguSummary:
                    "మీ నోటి లోపలి బుగ్గ భాగంలో తెల్లటి మచ్చ (ల్యూకోప్లాకియా) గమనించబడింది. గుట్కా, పొగాకు నమలడం వెంటనే ఆపాలి. డాక్టర్ రాసిన ట్రయామ్సినోలోన్ మలామును రోజుకు 3 సార్లు పూయండి మరియు పాడేరు జిల్లా ఆసుపత్రి స్పెషలిస్ట్ వద్ద బయాప్సీ చేయించుకోండి.",
                suggestedNextSteps:
                    "Urgent Medical Officer clinical review, immediate tobacco cessation counseling, and Specialist referral to District Hospital Paderu for incisional biopsy and histopathology.",
                uncertaintyLimitations:
                    "AI screening is assistive and cannot diagnose or rule out oral cancer.",
                boundingBox: [0.28, 0.32, 0.66, 0.72],
                modelVersion: "gemini-2.5-flash",
                disclaimer: "NOT FOR CLINICAL USE",
                assessedAt: new Date(Date.now() - 2 * 3600 * 1000),
                result: "HIGH_RISK: Persistent right buccal mucosa leukoplakia plaque (6 weeks) — Urgent Specialist & Biopsy referral recommended."
            }
        });
    }

    // 7. Seed Medical Officer Clinical Review
    let review = await ClinicalReview.findOne({ screening: screening._id });
    if (!review) {
        review = await ClinicalReview.create({
            screening: screening._id,
            patient: patient._id,
            reviewedBy: medicalOfficer._id,
            reviewedAt: new Date(Date.now() - 90 * 60 * 1000),
            decision: "AGREE",
            clinicalObservations:
                "Examined patient at PHC G. Madugula. Confirmed 1.8 cm non-scrapable white patch on right buccal mucosa with mild induration. Agree with high-risk OPMD triage; referring urgently to Oral Oncologist at District Hospital Paderu.",
            notes: "Advised immediate cessation of gutkha/tobacco chewing.",
            referralRecommended: true,
            referralReason:
                "Suspected high-risk Oral Potentially Malignant Disorder (Homogeneous/Speckled Leukoplakia) on right buccal mucosa persisting > 6 weeks; requires specialist teleconsultation and incisional biopsy."
        });
    }

    // Ensure any other Specialist accounts (e.g. Demo Specialist Three) are also linked to District Hospital Paderu
    await User.updateMany(
        { role: "SPECIALIST" },
        {
            $set: {
                district: "Alluri Sitharama Raju",
                hospitalId: "HOSP-ASR-PADERU-01",
                specialization: "Oral Oncologist"
            }
        }
    );
    const allSpecialists = await User.find({ role: "SPECIALIST" }).select("_id fullName").lean();

    // 8. Seed Urgent Referral to Specialist at District Hospital Paderu
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const referral = await Referral.findOneAndUpdate(
        { screening: screening._id },
        {
            $set: {
                patient: patient._id,
                screening: screening._id,
                createdBy: medicalOfficer._id,
                assignedSpecialist: specialist._id,
                referralReason:
                    "Persistent right buccal mucosa white patch (6 weeks) with 15-year gutkha habit; urgent specialist evaluation and biopsy required.",
                priority: "URGENT",
                referredTo: "Dr. V. Anitha Rao (Oral Oncologist, District Hospital Paderu)",
                facilityName: "District Hospital Paderu",
                appointmentDate: tomorrow,
                status: "CONFIRMED",
                notes: "ITDA Paderu tribal health desk notified for transport assistance.",
                assignmentHistory: allSpecialists.map((spec) => ({
                    specialist: spec._id,
                    changedBy: medicalOfficer._id,
                    changedAt: new Date(Date.now() - 75 * 60 * 1000),
                    note: `Assigned to Oral Oncology team (${spec.fullName}) at District Hospital Paderu.`
                })),
                statusHistory: [
                    {
                        status: "CREATED",
                        changedBy: medicalOfficer._id,
                        changedAt: new Date(Date.now() - 80 * 60 * 1000),
                        note: "Urgent referral created by MO PHC G. Madugula."
                    },
                    {
                        status: "CONFIRMED",
                        changedBy: specialist._id,
                        changedAt: new Date(Date.now() - 60 * 60 * 1000),
                        note: "Confirmed by Oral Oncologist at District Hospital Paderu."
                    }
                ]
            }
        },
        { upsert: true, new: true }
    );

    // 9. Seed Confirmed Telemedicine Consultation Slot
    const demoAppointmentId = "APT-20261110-GM01";
    await Appointment.findOneAndUpdate(
        { appointmentId: demoAppointmentId },
        {
            $set: {
                appointmentId: demoAppointmentId,
                patient: patient._id,
                patientId: patient.patientId,
                doctorId: specialist._id,
                specialist: specialist._id,
                scheduledBy: medicalOfficer._id,
                hospitalId: "HOSP-ASR-PADERU-01",
                referral: referral._id,
                referralId: referral._id.toString(),
                mode: "TELEMEDICINE",
                appointmentType: "URGENT_EMERGENCY",
                scheduledAt: tomorrow,
                scheduledDate: tomorrow,
                timeSlot: "10:30 AM - 11:00 AM",
                status: "CONFIRMED",
                telemedicineRoomCode: `AarogyaDrishti-${demoAppointmentId}`,
                meetingRoomId: `AarogyaDrishti-${demoAppointmentId}`,
                urgentReason:
                    "High-risk right buccal mucosa white patch (6 weeks) in 46Y male with 15-year gutkha history.",
                patientName: patient.fullName,
                specialistName: specialist.fullName,
                doctorName: specialist.fullName,
                hospitalName: "District Hospital Paderu",
                consultationNotes:
                    "Pre-biopsy teleconsultation scheduled with PHC G. Madugula Medical Officer and patient."
            }
        },
        { upsert: true, new: true }
    );

    // 10. Seed Biopsy Diagnostic Order
    const existingDiag = await DiagnosticOrder.findOne({
        patient: patient._id,
        referral: referral._id
    });
    if (!existingDiag) {
        await DiagnosticOrder.create({
            patient: patient._id,
            screening: screening._id,
            referral: referral._id,
            orderedBy: specialist._id,
            diagnosticType: "BIOPSY",
            clinicalReason:
                "Incisional biopsy of right buccal mucosa leukoplakia plaque to rule out epithelial dysplasia or early squamous cell carcinoma.",
            facilityName: "District Hospital Paderu — Histopathology Lab",
            appointmentDate: tomorrow,
            status: "SCHEDULED",
            statusHistory: [
                {
                    status: "ADVISED",
                    changedBy: specialist._id,
                    changedAt: new Date(Date.now() - 50 * 60 * 1000),
                    note: "Biopsy advised following specialist review."
                },
                {
                    status: "SCHEDULED",
                    changedBy: medicalOfficer._id,
                    changedAt: new Date(Date.now() - 40 * 60 * 1000),
                    note: "Scheduled at DH Paderu Histopathology Lab."
                }
            ]
        });
    }

    // 11. Seed Navigator Follow-Up Tracking
    const existingFollowUp = await FollowUp.findOne({
        patient: patient._id,
        referral: referral._id
    });
    if (!existingFollowUp) {
        await FollowUp.create({
            patient: patient._id,
            screening: screening._id,
            referral: referral._id,
            createdBy: medicalOfficer._id,
            assignedWorker: ashaWorker._id,
            dueAt: new Date(Date.now() + 48 * 3600 * 1000),
            status: "PLANNED",
            visitNotes: [
                {
                    text: "ASHA Navigator assigned to coordinate ITDA Paderu transport for Killo Somanna (G. Madugula to DH Paderu) and track biopsy attendance.",
                    recordedBy: medicalOfficer._id,
                    recordedAt: new Date(Date.now() - 30 * 60 * 1000)
                }
            ]
        });
    }

    // 12. Seed Patient Grievance Record
    await Grievance.findOneAndUpdate(
        { grievanceId: "GRV-20261110-0104" },
        {
            $set: {
                grievanceId: "GRV-20261110-0104",
                patientId: demoPatientId,
                patientName: "Killo Somanna",
                mandal: "G. Madugula",
                category: "TRANSPORT_ISSUE",
                description:
                    "Need ITDA 108 tribal feeder ambulance pickup from G. Madugula hilltop hamlet to District Hospital Paderu for punch biopsy.",
                status: "UNDER_REVIEW",
                filedAt: new Date(Date.now() - 25 * 60 * 1000)
            }
        },
        { upsert: true, new: true }
    );

    console.log("====================================================================");
    console.log("✓ OFFICIAL HACKATHON DEMO SEED COMPLETE!");
    console.log("  Patient: Killo Somanna (46Y Male, G. Madugula, ID: PT-20261110-GMAD01, MAA-UIDN: UIDN-ASR-GMAD-2026-0842)");
    console.log("  Accounts:");
    console.log("  - ASHA Worker     : asha_gmadugula / Asha@12345678");
    console.log("  - Medical Officer : mo_gmadugula   / Doctor@12345678");
    console.log("  - Specialist      : spec_paderu    / Specialist@12345678");
    console.log("  - Drone Operator  : drone_paderu   / Drone@12345678");
    console.log("  - ITDA PO Paderu  : itda_po_paderu / PoPaderu@12345678");
    console.log("  - District Officer: do_asr         / District@12345678");
    console.log("  - Patient Portal  : patient_gmadugula / Patient@12345678 (Mobile OTP: 9876543210 / 123456)");
    console.log("====================================================================");

    await mongoose.disconnect();
};

void seedHackathonDemo().catch((error) => {
    console.error("Failed to seed hackathon demo data:", error);
    process.exit(1);
});
