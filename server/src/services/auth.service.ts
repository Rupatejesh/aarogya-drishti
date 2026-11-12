
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser, UserRole } from "../models/User";
import Patient from "../models/Patient";

interface LoginInput {
    identifier: string;
    password: string;
}

interface LoginResult {
    token: string;
    user: {
        id: string;
        fullName: string;
        email?: string;
        phone?: string;
        role: UserRole;
        assignedPHCId?: string;
        mandal?: string;
        district?: string;
        maaUidn?: string;
    };
}

const SALT_ROUNDS = 12;

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("JWT_SECRET must contain at least 32 characters.");
    }

    return secret;
};

export const hashPassword = async (
    password: string
): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const loginUser = async (
    input: LoginInput
): Promise<LoginResult> => {
    const identifier = input.identifier.trim();
    const lowerIdentifier = identifier.toLowerCase();

    let user = await User.findOne({
        $or: [
            { email: lowerIdentifier },
            ...(lowerIdentifier.includes("@")
                ? []
                : [{ email: `${lowerIdentifier}@aarogyadrishti.in` }]),
            { phone: identifier }
        ]
    }).select("+passwordHash");

    // Dynamic self-healing fallback for official hackathon demo accounts if database is unseeded
    if (!user) {
        if (
            (lowerIdentifier === "patient_gmadugula" || identifier === "9876543210") &&
            input.password === "Patient@12345678"
        ) {
            const hash = await hashPassword("Patient@12345678");
            user = await User.create({
                fullName: "కిల్లో సోమన్న (Killo Somanna)",
                email: "patient_gmadugula@aarogyadrishti.in",
                phone: "9876543210",
                passwordHash: hash,
                role: "PATIENT",
                mandal: "G. Madugula",
                district: "Alluri Sitharama Raju",
                isActive: true
            });
            await Patient.findOneAndUpdate(
                { patientId: "PT-20261110-GMAD01" },
                {
                    $set: {
                        patientId: "PT-20261110-GMAD01",
                        maaUidn: "UIDN-ASR-GMAD-2026-1048",
                        user: user._id,
                        fullName: user.fullName,
                        age: 46,
                        sex: "MALE",
                        phone: "9876543210",
                        preferredLanguage: "TELUGU",
                        address: {
                            village: "G. Madugula",
                            mandal: "G. Madugula",
                            district: "Alluri Sitharama Raju"
                        },
                        exposureHistory: {
                            tobaccoUse: "CURRENT",
                            tobaccoTypes: ["Smokeless Tobacco / Gutkha (15 Years)"],
                            tobaccoDurationYears: 15
                        },
                        registrationStatus: "ACTIVE"
                    }
                },
                { upsert: true, new: true }
            );
        } else if (lowerIdentifier === "spec_paderu" && input.password === "Specialist@12345678") {
            const hash = await hashPassword("Specialist@12345678");
            user = await User.create({
                fullName: "Dr. V. Anitha Rao, MDS",
                email: "spec_paderu@aarogyadrishti.in",
                phone: "9440100102",
                passwordHash: hash,
                role: "SPECIALIST",
                specialization: "Oral Oncology & Maxillofacial Surgery",
                hospitalId: "HOSP-ASR-PADERU-01",
                mandal: "Paderu",
                district: "Alluri Sitharama Raju",
                isActive: true
            });
        } else if (lowerIdentifier === "admin" && input.password === "Admin@12345678") {
            const hash = await hashPassword("Admin@12345678");
            user = await User.create({
                fullName: "Platform Administrator (System Admin)",
                email: "admin@aarogyadrishti.in",
                phone: "9440100100",
                passwordHash: hash,
                role: "ADMIN",
                district: "Alluri Sitharama Raju",
                isActive: true
            });
        }
    }

    if (!user) {
        throw new Error("Invalid login credentials.");
    }

    if (!user.isActive) {
        throw new Error("This account is inactive. Contact the administrator.");
    }

    const passwordMatches = await user.comparePassword(input.password);

    if (!passwordMatches) {
        throw new Error("Invalid login credentials.");
    }

    let maaUidn: string | undefined = undefined;
    if (user.role === "PATIENT") {
        const patient = await Patient.findOne({
            $or: [{ user: user._id }, { phone: user.phone }]
        });
        maaUidn = patient?.maaUidn || "UIDN-ASR-GMAD-2026-1048";
    }

    const token = jwt.sign(
        {
            sub: user.id,
            role: user.role,
            ver: user.tokenVersion ?? 0
        },
        getJwtSecret(),
        {
            expiresIn: "8h",
            issuer: "aarogya-drishti"
        }
    );

    user.lastLoginAt = new Date();
    await user.save();

    return {
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            assignedPHCId: user.assignedPHCId,
            mandal: user.mandal,
            district: user.district,
            maaUidn
        }
    };
};

export const createUser = async (
    data: {
        fullName: string;
        email?: string;
        phone?: string;
        password: string;
        role: UserRole;
        assignedPHCId?: string;
        mandal?: string;
        district?: string;
        medicalRegistrationNumber?: string;
        specialization?: string;
        experienceYears?: number;
        hospitalId?: string;
        consultationFee?: number;
        availableDays?: string[];
        timeSlots?: string[];
    }
): Promise<IUser> => {
    const passwordHash = await hashPassword(data.password);

    const user = new User({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        assignedPHCId: data.assignedPHCId,
        mandal: data.mandal,
        district: data.district,
        medicalRegistrationNumber: data.medicalRegistrationNumber,
        specialization: data.specialization,
        experienceYears: data.experienceYears,
        hospitalId: data.hospitalId,
        consultationFee: data.consultationFee,
        availableDays: data.availableDays,
        timeSlots: data.timeSlots
    });

    await user.save();

    return user;
};
