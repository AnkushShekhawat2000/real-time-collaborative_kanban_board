import {
    createBoard,
    getBoards,
    getBoard,
    updateBoard,
    deleteBoard,
} from "../services/board.service.js";

export const createBoardController = async (req, res) => {
    try {
        const { name, description } = req.body || {};

        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Board name must be 2-100 characters",
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be a string",
            });
        }

        const board = await createBoard({
            tenantId: req.tenant.id,
            name: name.trim(),
            description,
        });

        return res.status(201).json({
            success: true,
            message: "Board created successfully",
            board,
        });
    } catch (error) {
        console.error("Create board error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create board",
        });
    }
};

export const getBoardsController = async (req, res) => {
    try {
        const boards = await getBoards(req.tenant.id);

        return res.status(200).json({
            success: true,
            count: boards.length,
            boards,
        });
    } catch (error) {
        console.error("Get boards error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch boards",
        });
    }
};

export const getBoardController = async (req, res) => {
    try {
        const board = await getBoard(
            req.tenant.id,
            req.params.boardId
        );

        if (!board) {
            return res.status(404).json({
                success: false,
                message: "Board not found",
            });
        }

        return res.status(200).json({
            success: true,
            board,
        });
    } catch (error) {
        console.error("Get board error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch board",
        });
    }
};

export const updateBoardController = async (req, res) => {
    try {
        const { name, description } = req.body || {};

        if (name === undefined && description === undefined) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update",
            });
        }

        if (
            name !== undefined &&
            (typeof name !== "string" ||
                name.trim().length < 2 ||
                name.trim().length > 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid board name",
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid description",
            });
        }

        const board = await updateBoard({
            tenantId: req.tenant.id,
            boardId: req.params.boardId,
            name: name?.trim(),
            description,
        });

        if (!board) {
            return res.status(404).json({
                success: false,
                message: "Board not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Board updated successfully",
            board,
        });
    } catch (error) {
        console.error("Update board error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update board",
        });
    }
};

export const deleteBoardController = async (req, res) => {
    try {
        const deleted = await deleteBoard(
            req.tenant.id,
            req.params.boardId
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Board not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Board deleted successfully",
        });
    } catch (error) {
        console.error("Delete board error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete board",
        });
    }
};
