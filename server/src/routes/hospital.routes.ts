import { Router, Request, Response, NextFunction } from "express";
import Hospital, { HOSPITAL_TYPES, HospitalType } from "../models/Hospital.model";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

const DEFAULT_HOSPITALS = [
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
            "Minor Oral Procedure Room",
            "Emergency Dental Care"
        ],
        workingHours: "24x7 / 9 AM - 5 PM",
        isActive: true
    },
    {
        hospitalId: "HOSP-ASR-ARAKU-01",
        name: "Area Hospital Araku Valley",
        type: "DISTRICT_HOSPITAL" as const,
        mandal: "Araku Valley",
        district: "Alluri Sitharama Raju",
        address: "Station Road, Araku Valley, ASR District",
        contactPhone: "08936-249222",
        facilities: [
            "Maxillofacial Consultation",
            "Biopsy/Histopathology",
            "Telemedicine Unit"
        ],
        workingHours: "24x7 / 9 AM - 5 PM",
        isActive: true
    },
    {
        hospitalId: "HOSP-ASR-HUKUMPETA-01",
        name: "Primary Health Centre Hukumpeta",
        type: "PHC" as const,
        mandal: "Hukumpeta",
        district: "Alluri Sitharama Raju",
        address: "Hukumpeta Village Center, ASR District",
        contactPhone: "08935-254102",
        facilities: [
            "Primary Oral Screening",
            "Telemedicine Unit",
            "ASHA Field Coordination Desk"
        ],
        workingHours: "9 AM - 5 PM",
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
            "Radiation & Medical Oncology",
            "Telemedicine Unit"
        ],
        workingHours: "24x7 / 9 AM - 5 PM",
        isActive: true
    }
];

const ensureDefaultHospitalsSeeded = async (): Promise<void> => {
    const count = await Hospital.countDocuments();
    if (count === 0) {
        for (const item of DEFAULT_HOSPITALS) {
            await Hospital.updateOne(
                { hospitalId: item.hospitalId },
                { $setOnInsert: item },
                { upsert: true }
            );
        }
    }
};

router.get(
    "/",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await ensureDefaultHospitalsSeeded();

            const query: Record<string, unknown> = { isActive: true };
            if (typeof req.query.mandal === "string" && req.query.mandal.trim().length > 0) {
                query.mandal = req.query.mandal.trim();
            }
            if (
                typeof req.query.type === "string" &&
                HOSPITAL_TYPES.includes(req.query.type.trim() as HospitalType)
            ) {
                query.type = req.query.type.trim();
            }

            const hospitals = await Hospital.find(query).sort({ type: 1, name: 1 });
            res.status(200).json({
                success: true,
                message: "Hospitals fetched successfully.",
                data: {
                    hospitals,
                    count: hospitals.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {
                hospitalId,
                name,
                type,
                mandal,
                district,
                address,
                contactPhone,
                facilities,
                workingHours,
                isActive
            } = req.body ?? {};

            if (
                typeof hospitalId !== "string" ||
                !hospitalId.trim() ||
                typeof name !== "string" ||
                !name.trim() ||
                typeof type !== "string" ||
                !HOSPITAL_TYPES.includes(type as HospitalType) ||
                typeof mandal !== "string" ||
                !mandal.trim() ||
                typeof address !== "string" ||
                !address.trim() ||
                typeof contactPhone !== "string" ||
                !contactPhone.trim()
            ) {
                res.status(400).json({
                    success: false,
                    message:
                        "hospitalId, name, valid type, mandal, address, and contactPhone are required."
                });
                return;
            }

            const created = await Hospital.create({
                hospitalId: hospitalId.trim(),
                name: name.trim(),
                type: type as HospitalType,
                mandal: mandal.trim(),
                district:
                    typeof district === "string" && district.trim()
                        ? district.trim()
                        : "Alluri Sitharama Raju",
                address: address.trim(),
                contactPhone: contactPhone.trim(),
                facilities: Array.isArray(facilities)
                    ? facilities.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
                    : [],
                workingHours:
                    typeof workingHours === "string" && workingHours.trim()
                        ? workingHours.trim()
                        : "24x7 / 9 AM - 5 PM",
                isActive: typeof isActive === "boolean" ? isActive : true
            });

            res.status(201).json({
                success: true,
                message: "Hospital record created successfully.",
                data: { hospital: created }
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
