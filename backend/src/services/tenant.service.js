import prisma from "../config/prisma.js";

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

export const getOrganizationTenants = async (organizationId) => {
    return prisma.tenant.findMany({
        where: {
            organizationId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
