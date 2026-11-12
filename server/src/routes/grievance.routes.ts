import { Router, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import Grievance from "../models/Grievance.model";

const router = Router();

router.get(
    "/",
    authenticate,
    async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            let grievances = await Grievance.find().sort({ filedAt: -1 }).lean();
            if (grievances.length === 0) {
                const seeded = await Grievance.create({
                    grievanceId: "GRV-20261110-0104",
                    patientId: "PT-20261110-GMAD01",
                    patientName: "Killo Somanna",
                    mandal: "G. Madugula",
                    category: "TRANSPORT_ISSUE",
                    description:
                        "Need ITDA 108 tribal feeder ambulance pickup from G. Madugula hilltop hamlet to District Hospital Paderu for punch biopsy.",
                    status: "UNDER_REVIEW",
                    filedAt: new Date()
                });
                grievances = [seeded.toObject()];
            }
            res.status(200).json({
                success: true,
                data: grievances
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {
                patientId = "PT-20261110-GMAD01",
                patientName = "Killo Somanna",
                mandal = "G. Madugula",
                category = "OTHER",
                description = ""
            } = req.body ?? {};

            if (!description || !String(description).trim()) {
                res.status(400).json({
                    success: false,
                    message: "Please enter a grievance description."
                });
                return;
            }

            const now = new Date();
            const dateStamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
            const randDigits = String(Math.floor(1000 + Math.random() * 9000));
            const grievanceId = `GRV-${dateStamp}-${randDigits}`;

            const created = await Grievance.create({
                grievanceId,
                patientId: String(patientId),
                patientName: String(patientName),
                mandal: String(mandal),
                category,
                description: String(description).trim(),
                status: "SUBMITTED",
                filedAt: now
            });

            res.status(201).json({
                success: true,
                message: "Grievance submitted successfully.",
                data: created
            });
        } catch (error) {
            next(error);
        }
    }
);

router.patch(
    "/:id/resolve",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const rawId = String(req.params.id || "");
            const {
                actionTaken = "ITDA Paderu Grievance Cell & Medical Officer verified and dispatched immediate redressal support."
            } = req.body ?? {};

            const updated = await Grievance.findOneAndUpdate(
                { $or: [{ _id: rawId.match(/^[0-9a-fA-F]{24}$/) ? rawId : null }, { grievanceId: rawId }] },
                {
                    $set: {
                        status: "RESOLVED",
                        actionTaken: String(actionTaken).trim()
                    }
                },
                { returnDocument: "after" }
            );

            if (!updated) {
                res.status(404).json({
                    success: false,
                    message: "Grievance record not found."
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Grievance resolved and redressal action dispatched.",
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
