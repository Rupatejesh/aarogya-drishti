
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

import {
    createDiagnosticOrderSchema,
    updateDiagnosticStatusSchema,
    recordDiagnosticResultSchema
} from "../validators/diagnostic.validator";

import {
    createDiagnosticOrder,
    getPatientDiagnosticOrders,
    updateDiagnosticOrderStatus,
    recordDiagnosticResult
} from "../services/diagnostic.service";
import { getPatientAccessFilter } from "../services/patient-access.service";
import { recordAudit } from "../services/audit.service";

// CREATE DIAGNOSTIC ORDER
export const createDiagnosticOrderRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = createDiagnosticOrderSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid diagnostic order information.",
                errors: validation.error.flatten()
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        const user = req.user;
        const accessFilter = await getPatientAccessFilter(user);

        const diagnosticOrder = await createDiagnosticOrder(
            {
                ...validation.data,
                orderedBy: user.id
            },
            accessFilter,
            { id: user.id, role: user.role }
        );

        await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            patientId: diagnosticOrder.patient.toString(),
            action: "DIAGNOSTIC_ORDER_CREATED",
            outcome: "SUCCESS",
            resourceType: "DiagnosticOrder",
            resourceId: diagnosticOrder.id,
            purpose: "A clinician-directed diagnostic order was created.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "Diagnostic order created successfully.",
            data: diagnosticOrder
        });
    } catch (error) {
        next(error);
    }
};

// GET PATIENT DIAGNOSTIC ORDERS
export const getPatientDiagnosticOrderRecords = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);

        const diagnosticOrders = await getPatientDiagnosticOrders(
            String(req.params.patientId),
            accessFilter,
            { id: req.user.id, role: req.user.role }
        );

        res.status(200).json({
            success: true,
            message: "Diagnostic orders retrieved successfully.",
            data: diagnosticOrders
        });
    } catch (error) {
        next(error);
    }
};

// UPDATE DIAGNOSTIC ORDER STATUS
export const updateDiagnosticOrderStatusRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = updateDiagnosticStatusSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid diagnostic status information.",
                errors: validation.error.flatten()
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        const user = req.user;
        const accessFilter = await getPatientAccessFilter(user);

        // Pass the authenticated user's role as the third argument.
        const diagnosticOrder = await updateDiagnosticOrderStatus(
            String(req.params.diagnosticId),
            user.id,
            user.role,
            validation.data,
            accessFilter,
            { id: user.id, role: user.role }
        );

        await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            patientId: diagnosticOrder.patient.toString(),
            action: "DIAGNOSTIC_STATUS_UPDATED",
            outcome: "SUCCESS",
            resourceType: "DiagnosticOrder",
            resourceId: diagnosticOrder.id,
            purpose: "A clinician updated diagnostic workflow status.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(200).json({
            success: true,
            message: "Diagnostic order status updated successfully.",
            data: diagnosticOrder
        });
    } catch (error) {
        next(error);
    }
};

export const recordDiagnosticResultRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = recordDiagnosticResultSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid diagnostic result.",
                errors: validation.error.flatten()
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        const user = req.user;
        const accessFilter = await getPatientAccessFilter(user);
        const result = await recordDiagnosticResult(
            String(req.params.diagnosticId),
            validation.data.resultText,
            { id: user.id, role: user.role },
            accessFilter
        );
        await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            patientId: result.patient.toString(),
            action: "DIAGNOSTIC_RESULT_RECORDED",
            outcome: "SUCCESS",
            resourceType: "DiagnosticOrder",
            resourceId: result.id,
            purpose: "An authorized clinician recorded a received diagnostic result.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "Diagnostic result recorded.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};
