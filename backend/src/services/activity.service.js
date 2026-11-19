import prisma from "../config/prisma.js";

export const createActivity = async ({
    tenantId,
    userId,
    action,
    entityType,
    entityId,
    details,
}) => {
    return prisma.activityLog.create({
        data: {
            tenantId,
            userId,
            action,
            entityType,
            entityId,
            metadata: details,
        },
    });
};

export const getTenantActivities = async ({
    tenantId,
    page = 1,
    limit = 20,
}) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [activities, total] = await prisma.$transaction([
        prisma.activityLog.findMany({
            where: { tenantId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: (safePage - 1) * safeLimit,
            take: safeLimit,
        }),
        prisma.activityLog.count({
            where: { tenantId },
        }),
    ]);

    return {
        activities,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        },
    };
};
