import { getTenantActivities } from "../services/activity.service.js";

export const getActivitiesController = async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination values",
            });
        }

        const result = await getTenantActivities({
            tenantId: req.tenant.id,
            page,
            limit,
        });

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Activity fetch error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch activities",
        });
    }
};
