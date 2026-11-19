import prisma from "../config/prisma.js";

export const createTask = async ({
    columnId,
    title,
    description,
    priority,
    dueDate,
}) => {
    return prisma.$transaction(async (tx) => {
        const lastTask = await tx.task.findFirst({
            where: { columnId },
            orderBy: { position: "desc" },
            select: { position: true },
        });

        return tx.task.create({
            data: {
                columnId,
                title,
                description,
                priority,
                dueDate,
                position: lastTask
                    ? lastTask.position + 1
                    : 0,
            },
        });
    });
};

export const getTasks = async (columnId) => {
    return prisma.task.findMany({
        where: { columnId },
        orderBy: { position: "asc" },
    });
};

export const getTask = async (columnId, taskId) => {
    return prisma.task.findFirst({
        where: {
            id: taskId,
            columnId,
        },
    });
};

export const updateTask = async ({
    taskId,
    columnId,
    expectedVersion,
    data,
}) => {
    return prisma.$transaction(async (tx) => {
        const result = await tx.task.updateMany({
            where: {
                id: taskId,
                columnId,
                version: expectedVersion,
            },
            data: {
                ...data,
                version: {
                    increment: 1,
                },
            },
        });

        if (result.count === 0) {
            const existing = await tx.task.findFirst({
                where: {
                    id: taskId,
                    columnId,
                },
                select: { id: true },
            });

            return existing ? "CONFLICT" : null;
        }

        return tx.task.findFirst({
            where: {
                id: taskId,
                columnId,
            },
        });
    });
};

export const deleteTask = async (columnId, taskId) => {
    const result = await prisma.task.deleteMany({
        where: {
            id: taskId,
            columnId,
        },
    });

    return result.count > 0;
};
