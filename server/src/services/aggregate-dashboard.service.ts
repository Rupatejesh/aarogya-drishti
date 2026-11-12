import Patient from "../models/Patient";
import Screening from "../models/Screening";
import Referral from "../models/Referral";
import DiagnosticOrder from "../models/DiagnosticOrder";
import FollowUp from "../models/FollowUp";

const MINIMUM_GROUP_SIZE = 5;
const PERIOD_COUNT = 12;

export interface AggregateDashboardActor {
    role: string;
    district?: string;
    mandal?: string;
    assignedPHCId?: string;
}

export const getAggregateScope = (
    actor: AggregateDashboardActor
): Record<string, string> => {
    if (!["DISTRICT_OFFICER", "ITDA_PROJECT_OFFICER"].includes(actor.role)) {
        throw Object.assign(
            new Error("This role cannot access aggregate programme reports."),
            { statusCode: 403 }
        );
    }
    if (!actor.district?.trim()) {
        throw Object.assign(
            new Error("A district assignment is required for aggregate reports."),
            { statusCode: 403 }
        );
    }

    return {
        "address.district": actor.district,
        ...(actor.mandal ? { "address.mandal": actor.mandal } : {}),
        ...(actor.assignedPHCId
            ? { "address.phcId": actor.assignedPHCId }
            : {})
    };
};

const buildPeriods = (now: Date) => {
    const firstMonth = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - (PERIOD_COUNT - 1),
        1
    ));
    return Array.from({ length: PERIOD_COUNT }, (_, index) => {
        const month = new Date(Date.UTC(
            firstMonth.getUTCFullYear(),
            firstMonth.getUTCMonth() + index,
            1
        ));
        return `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;
    });
};

const scopedEventCounts = async (
    model: typeof Screening | typeof Referral | typeof DiagnosticOrder | typeof FollowUp,
    dateField: string,
    scope: Record<string, string>,
    start: Date
): Promise<Map<string, number>> => {
    const patientConditions = [
        { $eq: ["$_id", "$$patientId"] },
        { $eq: ["$registrationStatus", "ACTIVE"] },
        ...Object.entries(scope).map(([field, value]) => ({
            $eq: [`$${field}`, value]
        }))
    ];
    const rows = await model.aggregate([
        { $match: { [dateField]: { $gte: start } } },
        {
            $lookup: {
                from: "patients",
                let: { patientId: "$patient" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $and: patientConditions }
                        }
                    },
                    { $project: { _id: 1 } }
                ],
                as: "authorizedPatient"
            }
        },
        { $match: { "authorizedPatient.0": { $exists: true } } },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m",
                        date: `$${dateField}`,
                        timezone: "UTC"
                    }
                },
                count: { $sum: 1 }
            }
        },
        { $project: { _id: 1, count: 1 } }
    ]).exec() as { _id: string; count: number }[];

    return new Map(rows.map((row) => [row._id, row.count]));
};

export const buildSuppressedPeriods = (
    periods: string[],
    counts: Map<string, number>
) => periods.map((period) => {
    const count = counts.get(period) ?? 0;
    return {
        period,
        count: count === 0 || count >= MINIMUM_GROUP_SIZE ? count : null,
        suppressed: count > 0 && count < MINIMUM_GROUP_SIZE
    };
});

export const getAggregateDashboard = async (
    actor: AggregateDashboardActor,
    now = new Date()
) => {
    const scope = getAggregateScope(actor);
    const [population] = await Patient.aggregate([
        { $match: { ...scope, registrationStatus: "ACTIVE" } },
        { $count: "count" }
    ]).exec() as { count: number }[];
    const populationCount = population?.count ?? 0;

    if (populationCount < MINIMUM_GROUP_SIZE) {
        return {
            scopeSuppressed: true,
            minimumGroupSize: MINIMUM_GROUP_SIZE,
            periods: []
        };
    }

    const periods = buildPeriods(now);
    const start = new Date(`${periods[0]}-01T00:00:00.000Z`);
    const [screenings, referrals, diagnostics, followUps] = await Promise.all([
        scopedEventCounts(Screening, "screeningDate", scope, start),
        scopedEventCounts(Referral, "createdAt", scope, start),
        scopedEventCounts(DiagnosticOrder, "createdAt", scope, start),
        scopedEventCounts(FollowUp, "dueAt", scope, start)
    ]);

    return {
        scopeSuppressed: false,
        minimumGroupSize: MINIMUM_GROUP_SIZE,
        periods: periods.map((period) => ({
            period,
            screenings: buildSuppressedPeriods([period], screenings)[0],
            referrals: buildSuppressedPeriods([period], referrals)[0],
            diagnosticOrders: buildSuppressedPeriods([period], diagnostics)[0],
            followUps: buildSuppressedPeriods([period], followUps)[0]
        }))
    };
};
