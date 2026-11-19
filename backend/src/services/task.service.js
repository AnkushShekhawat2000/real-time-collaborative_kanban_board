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
    tenantId,
    userId,
    expectedVersion,
    data,
}) => {
    return prisma.$transaction(async (tx) => {
        const existingTask = await tx.task.findFirst({
            where: {
                id: taskId,
                columnId,
            },
            select: {
                title: true,
                description: true,
                priority: true,
                dueDate: true,
            },
        });

        if (!existingTask) {
            return null;
        }

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

        if (result.count !== 1) {
            return "CONFLICT";
        }

        const updatedTask = await tx.task.findFirst({
            where: {
                id: taskId,
                columnId,
            },
        });

        await tx.activityLog.create({
            data: {
                tenantId,
                userId,
                action: "TASK_UPDATED",
                entityType: "TASK",
                entityId: taskId,
                metadata: {
                    old: {
                        ...existingTask,
                        dueDate: existingTask.dueDate?.toISOString() || null,
                    },
                    new: {
                        title: updatedTask.title,
                        description: updatedTask.description,
                        priority: updatedTask.priority,
                        dueDate: updatedTask.dueDate?.toISOString() || null,
                    },
                },
            },
        });

        return updatedTask;
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

export const reorderTasks = async ({
    boardId,
    columnId,
    taskIds,
}) => {
    return prisma.$transaction(
        async (tx) => {
            const column = await tx.column.findFirst({
                where: {
                    id: columnId,
                    boardId,
                },
            });

            if (!column) {
                return null;
            }

            const existingTasks = await tx.task.findMany({
                where: { columnId },
                select: { id: true },
            });

            if (
                existingTasks.length !== taskIds.length ||
                new Set(taskIds).size !== taskIds.length ||
                !existingTasks.every((task) => taskIds.includes(task.id))
            ) {
                return "INVALID_ORDER";
            }

            for (let i = 0; i < taskIds.length; i++) {
                await tx.task.update({
                    where: { id: taskIds[i] },
                    data: { position: -(i + 1) },
                });
            }

            for (let i = 0; i < taskIds.length; i++) {
                await tx.task.update({
                    where: { id: taskIds[i] },
                    data: {
                        position: i,
                        version: { increment: 1 },
                    },
                });
            }

            return tx.task.findMany({
                where: { columnId },
                orderBy: { position: "asc" },
            });
        },
        {
            isolationLevel: "Serializable",
        }
    );
};

export const moveTask = async ({
    taskId,
    sourceColumnId,
    destinationColumnId,
    destinationPosition,
    expectedVersion,
    boardId,
}) => {
    return prisma.$transaction(
        async (tx) => {
            const [source, destination] = await Promise.all([
                tx.column.findFirst({
                    where: {
                        id: sourceColumnId,
                        boardId,
                    },
                }),
                tx.column.findFirst({
                    where: {
                        id: destinationColumnId,
                        boardId,
                    },
                }),
            ]);

            if (!source || !destination) {
                return { status: "NOT_FOUND" };
            }

            const task = await tx.task.findFirst({
                where: {
                    id: taskId,
                    columnId: sourceColumnId,
                },
            });

            if (!task) {
                return { status: "NOT_FOUND" };
            }

            if (task.version !== expectedVersion) {
                return { status: "CONFLICT" };
            }

            const sourceTasks = await tx.task.findMany({
                where: { columnId: sourceColumnId },
                orderBy: { position: "asc" },
            });

            const destinationTasks =
                sourceColumnId === destinationColumnId
                    ? sourceTasks
                    : await tx.task.findMany({
                        where: { columnId: destinationColumnId },
                        orderBy: { position: "asc" },
                    });

            const remainingSource = sourceTasks.filter(
                (item) => item.id !== taskId
            );
            const newDestination = sourceColumnId === destinationColumnId
                ? [...remainingSource]
                : [...destinationTasks];

            const position = Math.max(
                0,
                Math.min(destinationPosition, newDestination.length)
            );

            newDestination.splice(position, 0, task);

            for (let i = 0; i < sourceTasks.length; i++) {
                await tx.task.update({
                    where: { id: sourceTasks[i].id },
                    data: { position: -(i + 1) },
                });
            }

            if (sourceColumnId !== destinationColumnId) {
                for (let i = 0; i < destinationTasks.length; i++) {
                    await tx.task.update({
                        where: { id: destinationTasks[i].id },
                        data: { position: -(i + 1) },
                    });
                }

                await tx.task.update({
                    where: { id: taskId },
                    data: {
                        columnId: destinationColumnId,
                        position: -(destinationTasks.length + 1),
                    },
                });
            }

            const sourceFinal = sourceColumnId === destinationColumnId
                ? newDestination
                : remainingSource;

            for (let i = 0; i < sourceFinal.length; i++) {
                await tx.task.update({
                    where: { id: sourceFinal[i].id },
                    data: {
                        position: i,
                        version: { increment: 1 },
                    },
                });
            }

            if (sourceColumnId !== destinationColumnId) {
                for (let i = 0; i < newDestination.length; i++) {
                    await tx.task.update({
                        where: { id: newDestination[i].id },
                        data: {
                            position: i,
                            version: { increment: 1 },
                        },
                    });
                }
            }

            return {
                status: "SUCCESS",
                task: await tx.task.findUnique({
                    where: { id: taskId },
                }),
            };
        },
        {
            isolationLevel: "Serializable",
        }
    );
};

export const assignTask = async ({
    taskId,
    columnId,
    tenantId,
    assigneeId,
}) => {
    return prisma.$transaction(async (tx) => {
        const task = await tx.task.findFirst({
            where: {
                id: taskId,
                columnId,
                column: {
                    board: {
                        tenantId,
                    },
                },
            },
        });

        if (!task) {
            return { status: "TASK_NOT_FOUND" };
        }

        const membership = await tx.membership.findFirst({
            where: {
                tenantId,
                userId: assigneeId,
            },
        });

        if (!membership) {
            return { status: "INVALID_ASSIGNEE" };
        }

        const result = await tx.task.updateMany({
            where: {
                id: taskId,
                columnId,
                version: task.version,
            },
            data: {
                assigneeId,
                version: { increment: 1 },
            },
        });

        if (result.count === 0) {
            return { status: "CONFLICT" };
        }

        return {
            status: "SUCCESS",
            task: await tx.task.findUnique({
                where: { id: taskId },
                include: {
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
        };
    });
};

export const unassignTask = async ({
    taskId,
    columnId,
    tenantId,
}) => {
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            columnId,
            column: {
                board: { tenantId },
            },
        },
    });

    if (!task) {
        return { status: "TASK_NOT_FOUND" };
    }

    const result = await prisma.task.updateMany({
        where: {
            id: taskId,
            columnId,
            version: task.version,
        },
        data: {
            assigneeId: null,
            version: { increment: 1 },
        },
    });

    if (!result.count) {
        return { status: "CONFLICT" };
    }

    return {
        status: "SUCCESS",
        task: await prisma.task.findUnique({
            where: { id: taskId },
        }),
    };
};
