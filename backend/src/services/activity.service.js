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
    boardId,
    page = 1,
    limit = 20,
}) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const where = { tenantId };

    if (boardId) {
        const tasks = await prisma.task.findMany({
            where: {
                column: {
                    board: {
                        id: boardId,
                        tenantId,
                    },
                },
            },
            select: { id: true },
        });

        where.entityType = "TASK";
        where.entityId = {
            in: tasks.map((task) => task.id),
        };
    }

    const [activities, total] = await prisma.$transaction([
        prisma.activityLog.findMany({
            where,
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
            where,
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
