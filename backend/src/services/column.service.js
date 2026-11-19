import prisma from "../config/prisma.js";

export const createColumn = async ({
    boardId,
    name,
}) => {
    return prisma.$transaction(async (tx) => {
        const board = await tx.board.findUnique({
            where: { id: boardId },
            select: { id: true },
        });

        if (!board) {
            return null;
        }

        const lastColumn = await tx.column.findFirst({
            where: { boardId },
            orderBy: { position: "desc" },
            select: { position: true },
        });

        const position = lastColumn
            ? lastColumn.position + 1
            : 0;

        return tx.column.create({
            data: {
                boardId,
                name,
                position,
            },
        });
    }, {
        isolationLevel: "Serializable",
    });
};

export const getColumns = async (boardId) => {
    return prisma.column.findMany({
        where: { boardId },
        orderBy: { position: "asc" },
        include: {
            tasks: {
                orderBy: { position: "asc" },
                include: {
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
};

export const getColumn = async (boardId, columnId) => {
    return prisma.column.findFirst({
        where: {
            id: columnId,
            boardId,
        },
        include: {
            tasks: true,
        },
    });
};

export const updateColumn = async ({
    boardId,
    columnId,
    name,
}) => {
    const result = await prisma.column.updateMany({
        where: {
            id: columnId,
            boardId,
        },
        data: { name },
    });

    if (result.count === 0) {
        return null;
    }

    return getColumn(boardId, columnId);
};

export const deleteColumn = async (boardId, columnId) => {
    const result = await prisma.column.deleteMany({
        where: {
            id: columnId,
            boardId,
        },
    });

    return result.count > 0;
};

export const reorderColumns = async (boardId, columnIds) => {
    return prisma.$transaction(async (tx) => {
        const columns = await tx.column.findMany({
            where: { boardId },
            select: { id: true },
        });

        if (
            columns.length !== columnIds.length ||
            new Set(columnIds).size !== columnIds.length ||
            !columns.every((column) => columnIds.includes(column.id))
        ) {
            throw new Error("INVALID_COLUMN_ORDER");
        }

        for (let i = 0; i < columnIds.length; i++) {
            await tx.column.update({
                where: { id: columnIds[i] },
                data: { position: -(i + 1) },
            });
        }

        for (let i = 0; i < columnIds.length; i++) {
            await tx.column.update({
                where: { id: columnIds[i] },
                data: { position: i },
            });
        }

        return tx.column.findMany({
            where: { boardId },
            orderBy: { position: "asc" },
        });
    });
};
