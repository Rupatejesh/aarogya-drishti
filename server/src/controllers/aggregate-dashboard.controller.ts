import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getAggregateDashboard } from "../services/aggregate-dashboard.service";
import { recordAudit } from "../services/audit.service";

export const getAggregateDashboardRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const report = await getAggregateDashboard(req.user);
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: "AGGREGATE_REPORT_VIEWED",
            outcome: "SUCCESS",
            resourceType: "AggregateDashboard",
            purpose: "Authorized aggregate programme report access.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.status(200).json({
            success: true,
            message: "Aggregate programme report retrieved.",
            data: report
        });
    } catch (error) {
        next(error);
    }
};
