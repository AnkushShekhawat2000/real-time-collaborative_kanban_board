import * as columnService from "../services/column.service.js";

const emitColumnEvent = (req, event, data = {}) => {
    req.app.get("io")
        .to(`tenant:${req.tenant.id}`)
        .emit(event, {
            ...data,
            tenantId: req.tenant.id,
            boardId: req.board.id,
            actorId: req.user.userId,
        });
};

export const createColumnController = async (req, res) => {
    try {
        const { name } = req.body || {};

        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Column name must be 2-100 characters",
            });
        }

        const column = await columnService.createColumn({
            boardId: req.board.id,
            name: name.trim(),
        });

        if (!column) {
            return res.status(404).json({
                success: false,
                message: "Board not found",
            });
        }

        emitColumnEvent(req, "column:created", {
            columnId: column.id,
        });

        return res.status(201).json({
            success: true,
            message: "Column created successfully",
            column,
        });
    } catch (error) {
        console.error(error);

        if (error.code === "P2034" || error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Column order changed concurrently. Refresh and retry.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create column",
        });
    }
};

export const getColumnsController = async (req, res) => {
    try {
        const columns = await columnService.getColumns(req.board.id);

        return res.status(200).json({
            success: true,
            count: columns.length,
            columns,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch columns",
        });
    }
};

export const getColumnController = async (req, res) => {
    try {
        const column = await columnService.getColumn(
            req.board.id,
            req.params.columnId
        );

        if (!column) {
            return res.status(404).json({
                success: false,
                message: "Column not found",
            });
        }

        emitColumnEvent(req, "column:updated", {
            columnId: column.id,
            name: column.name,
        });

        return res.status(200).json({
            success: true,
            column,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch column",
        });
    }
};

export const updateColumnController = async (req, res) => {
    try {
        const { name } = req.body || {};

        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid column name",
            });
        }

        const column = await columnService.updateColumn({
            boardId: req.board.id,
            columnId: req.params.columnId,
            name: name.trim(),
        });

        if (!column) {
            return res.status(404).json({
                success: false,
                message: "Column not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Column updated successfully",
            column,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to update column",
        });
    }
};

export const deleteColumnController = async (req, res) => {
    try {
        const deleted = await columnService.deleteColumn(
            req.board.id,
            req.params.columnId
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Column not found",
            });
        }

        emitColumnEvent(req, "column:deleted", {
            columnId: req.params.columnId,
        });

        return res.status(200).json({
            success: true,
            message: "Column deleted successfully",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete column",
        });
    }
};

export const reorderColumnsController = async (req, res) => {
    try {
        const { columnIds } = req.body || {};

        if (
            !Array.isArray(columnIds) ||
            !columnIds.every((id) => typeof id === "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid columnIds array is required",
            });
        }

        const columns = await columnService.reorderColumns(
            req.board.id,
            columnIds
        );

        emitColumnEvent(req, "column:reordered", {
            columnIds: columns.map((column) => column.id),
        });

        return res.status(200).json({
            success: true,
            message: "Columns reordered successfully",
            columns,
        });
    } catch (error) {
        if (error.message === "INVALID_COLUMN_ORDER") {
            return res.status(400).json({
                success: false,
                message: "Column IDs must exactly match this board's columns",
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to reorder columns",
        });
    }
};
