import prisma from "../config/prisma.js";

export const createBoard = async ({
    tenantId,
    name,
    description,
}) => {
    return prisma.board.create({
        data: {
            tenantId,
            name,
            description,
        },
    });
};

export const getBoards = async (tenantId) => {
    return prisma.board.findMany({
        where: {
            tenantId,
        },
        include: {
            columns: {
                orderBy: {
                    position: "asc",
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const getBoard = async (tenantId, boardId) => {
    return prisma.board.findFirst({
        where: {
            id: boardId,
            tenantId,
        },
        include: {
            columns: {
                orderBy: {
                    position: "asc",
                },
                include: {
                    tasks: {
                        orderBy: {
                            position: "asc",
                        },
                    },
                },
            },
        },
    });
};

export const updateBoard = async ({
    tenantId,
    boardId,
    name,
    description,
}) => {
    const result = await prisma.board.updateMany({
        where: {
            id: boardId,
            tenantId,
        },
        data: {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
        },
    });

    if (result.count === 0) {
        return null;
    }

    return prisma.board.findFirst({
        where: {
            id: boardId,
            tenantId,
        },
    });
};

export const deleteBoard = async (tenantId, boardId) => {
    const result = await prisma.board.deleteMany({
        where: {
            id: boardId,
            tenantId,
        },
    });

    return result.count > 0;
};
