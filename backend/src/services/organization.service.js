import { randomUUID } from "node:crypto";

import prisma from "../config/prisma.js";

export const createOrganization = async ({ name, userId }) => {
    const slugBase = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "organization";
    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;

    return prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
            data: {
                name,
                slug,
            },
        });

        await tx.membership.create({
            data: {
                userId,
                organizationId: organization.id,
                role: "ORG_ADMIN",
            },
        });

        return organization;
    });
};

export const getUserOrganizations = async (userId) => {
    return prisma.organization.findMany({
        where: {
            memberships: {
                some: { userId },
            },
        },
        select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
};

export const updateOrganization = async (organizationId, name) => (
    prisma.organization.update({
        where: { id: organizationId },
        data: { name },
    })
);

export const deleteOrganization = async (organizationId) => {
    const result = await prisma.organization.deleteMany({
        where: { id: organizationId },
    });

    return result.count > 0;
};
