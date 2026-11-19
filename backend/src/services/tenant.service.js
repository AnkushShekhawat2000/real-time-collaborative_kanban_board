import prisma from "../config/prisma.js";
import { getTenantMembershipPolicyError } from "./tenantMembershipPolicy.js";

export const createTenant = async ({
    organizationId,
    name,
    slug,
}) => {
    return prisma.tenant.create({
        data: {
            organizationId,
            name,
            slug,
        },
    });
};

export const getTenantById = async (tenantId) => {
    return prisma.tenant.findUnique({
        where: {
            id: tenantId,
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const getOrganizationTenants = async (organizationId, tenantIds) => {
    return prisma.tenant.findMany({
        where: {
            organizationId,
            ...(tenantIds && {
                id: { in: tenantIds },
            }),
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const updateTenant = async (tenantId, name) => {
    const result = await prisma.tenant.updateMany({
        where: { id: tenantId },
        data: { name },
    });

    if (result.count === 0) {
        return null;
    }

    return getTenantById(tenantId);
};

export const deleteTenant = async (tenantId) => {
    const result = await prisma.tenant.deleteMany({
        where: { id: tenantId },
    });

    return result.count > 0;
};

export const getTenantMembers = async (tenantId) => (
    prisma.membership.findMany({
        where: { tenantId },
        select: {
            id: true,
            userId: true,
            tenantId: true,
            role: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: "asc" },
    })
);

export const createTenantMember = async ({
    tenantId,
    email,
    role,
    actorRole,
}) => {
    const policyError = getTenantMembershipPolicyError({
        actorRole,
        requestedRole: role,
    });

    if (policyError) {
        return { status: policyError };
    }

    return prisma.$transaction(async (tx) => {
        const [tenant, user] = await Promise.all([
            tx.tenant.findUnique({
                where: { id: tenantId },
                select: { organizationId: true },
            }),
            tx.user.findUnique({
                where: { email },
                select: { id: true },
            }),
        ]);

        if (!tenant) {
            return { status: "TENANT_NOT_FOUND" };
        }

        if (!user) {
            return { status: "USER_NOT_FOUND" };
        }

        const membership = await tx.membership.create({
            data: {
                userId: user.id,
                organizationId: tenant.organizationId,
                tenantId,
                role,
            },
            select: {
                id: true,
                userId: true,
                tenantId: true,
                role: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return { status: "SUCCESS", membership };
    });
};

export const updateTenantMemberRole = async ({
    tenantId,
    membershipId,
    role,
    actorRole,
}) => {
    if (typeof role !== "string") {
        return { status: "INVALID_ROLE" };
    }

    const rolePolicyError = getTenantMembershipPolicyError({
        actorRole,
        requestedRole: role,
    });

    if (rolePolicyError) {
        return { status: rolePolicyError };
    }

    return prisma.$transaction(async (tx) => {
        const membership = await tx.membership.findFirst({
            where: { id: membershipId, tenantId },
        });

        if (!membership) {
            return { status: "MEMBERSHIP_NOT_FOUND" };
        }

        const targetPolicyError = getTenantMembershipPolicyError({
            actorRole,
            targetRole: membership.role,
        });

        if (targetPolicyError) {
            return { status: targetPolicyError };
        }

        if (
            membership.role === "TENANT_ADMIN" &&
            role !== "TENANT_ADMIN"
        ) {
            const adminCount = await tx.membership.count({
                where: { tenantId, role: "TENANT_ADMIN" },
            });

            if (adminCount <= 1) {
                return { status: "LAST_TENANT_ADMIN" };
            }
        }

        const updated = await tx.membership.update({
            where: { id: membershipId },
            data: { role },
            select: {
                id: true,
                userId: true,
                tenantId: true,
                role: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return { status: "SUCCESS", membership: updated };
    }, {
        isolationLevel: "Serializable",
    });
};

export const deleteTenantMember = async ({
    tenantId,
    membershipId,
    actorRole,
}) => prisma.$transaction(async (tx) => {
    const membership = await tx.membership.findFirst({
        where: { id: membershipId, tenantId },
    });

    if (!membership) {
        return { status: "MEMBERSHIP_NOT_FOUND" };
    }

    const targetPolicyError = getTenantMembershipPolicyError({
        actorRole,
        targetRole: membership.role,
    });

    if (targetPolicyError) {
        return { status: targetPolicyError };
    }

    if (membership.role === "TENANT_ADMIN") {
        const adminCount = await tx.membership.count({
            where: { tenantId, role: "TENANT_ADMIN" },
        });

        if (adminCount <= 1) {
            return { status: "LAST_TENANT_ADMIN" };
        }
    }

    await tx.membership.delete({ where: { id: membershipId } });
    return {
        status: "SUCCESS",
        userId: membership.userId,
        organizationId: membership.organizationId,
    };
}, {
    isolationLevel: "Serializable",
});
