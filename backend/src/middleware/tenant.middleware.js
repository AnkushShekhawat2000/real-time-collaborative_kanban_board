import prisma from "../config/prisma.js";

export const verifyTenantAccess = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const tenantId = req.params.tenantId || req.body?.tenantId;

        if (typeof tenantId !== "string" || !tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant ID is required",
            });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                organizationId: true,
            },
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        const memberships = await prisma.membership.findMany({
            where: {
                userId,
                organizationId: tenant.organizationId,
            },
        });

        const organizationMembership = memberships.find(
            (membership) =>
                membership.role === "ORG_ADMIN" &&
                membership.tenantId === null
        );

        const tenantMembership = memberships.find(
            (membership) =>
                membership.tenantId === tenantId &&
                ["TENANT_ADMIN", "MEMBER"].includes(membership.role)
        );

        if (!organizationMembership && !tenantMembership) {
            return res.status(403).json({
                success: false,
                message: "Access denied for this tenant",
            });
        }

        req.tenant = tenant;
        req.membership = organizationMembership || tenantMembership;

        next();
    } catch (error) {
        console.error("Tenant authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Tenant authorization failed",
        });
    }
};
