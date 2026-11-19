import prisma from "../config/prisma.js";

export const verifyBoardAccess = async (req, res, next) => {
    try {
        const boardId = req.params.boardId || req.body?.boardId;

        if (typeof boardId !== "string" || !boardId) {
            return res.status(400).json({
                success: false,
                message: "Board ID is required",
            });
        }

        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                tenantId: req.tenant.id,
            },
        });

        if (!board) {
            return res.status(404).json({
                success: false,
                message: "Board not found in this tenant",
            });
        }

        req.board = board;

        next();
    } catch (error) {
        console.error("Board verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Board verification failed",
        });
    }
};
