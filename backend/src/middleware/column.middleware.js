import prisma from "../config/prisma.js";

export const verifyColumnAccess = async (req, res, next) => {
    try {
        const columnId = req.params.columnId || req.body?.columnId;

        if (typeof columnId !== "string" || !columnId) {
            return res.status(400).json({
                success: false,
                message: "Column ID required",
            });
        }

        const column = await prisma.column.findFirst({
            where: {
                id: columnId,
                boardId: req.board.id,
            },
        });

        if (!column) {
            return res.status(404).json({
                success: false,
                message: "Column not found in this board",
            });
        }

        req.column = column;

        next();
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Column verification failed",
        });
    }
};
