import prisma from "../config/prisma.js";

export const verifyOrganizationAdmin = async (req, res, next) => {
    try {
        const organizationId = req.params.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required",
            });
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: req.user.userId,
                organizationId,
                tenantId: null,
                role: "ORG_ADMIN",
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "Organization admin access required",
            });
        }

        req.organizationMembership = membership;
        return next();
    } catch (error) {
        console.error("Organization authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Organization authorization failed",
        });
    }
};
