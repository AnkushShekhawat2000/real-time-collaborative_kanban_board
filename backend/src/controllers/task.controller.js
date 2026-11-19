import * as taskService from "../services/task.service.js";

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const createTaskController = async (req, res) => {
    try {
        const {
            title,
            description,
            priority = "MEDIUM",
            dueDate,
        } = req.body || {};

        if (
            typeof title !== "string" ||
            title.trim().length < 2 ||
            title.trim().length > 200
        ) {
            return res.status(400).json({
                success: false,
                message: "Title must be 2-200 characters",
            });
        }

        if (!priorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid priority",
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

        let parsedDueDate;

        if (dueDate !== undefined && dueDate !== null) {
            parsedDueDate = new Date(dueDate);

            if (Number.isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid due date",
                });
            }
        }

        const task = await taskService.createTask({
            columnId: req.column.id,
            title: title.trim(),
            description,
            priority,
            dueDate: parsedDueDate,
        });

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to create task",
        });
    }
};

export const getTasksController = async (req, res) => {
    try {
        const tasks = await taskService.getTasks(req.column.id);

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch tasks",
        });
    }
};

export const getTaskController = async (req, res) => {
    try {
        const task = await taskService.getTask(
            req.column.id,
            req.params.taskId
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        return res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch task",
        });
    }
};

export const updateTaskController = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            expectedVersion,
        } = req.body || {};

        if (
            !Number.isInteger(expectedVersion) ||
            expectedVersion < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid expectedVersion is required",
            });
        }

        const data = {};

        if (title !== undefined) {
            if (
                typeof title !== "string" ||
                title.trim().length < 2 ||
                title.trim().length > 200
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid title",
                });
            }

            data.title = title.trim();
        }

        if (description !== undefined) {
            if (
                description !== null &&
                typeof description !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid description",
                });
            }

            data.description = description;
        }

        if (priority !== undefined) {
            if (!priorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid priority",
                });
            }

            data.priority = priority;
        }

        if (dueDate !== undefined) {
            if (dueDate === null) {
                data.dueDate = null;
            } else {
                const parsed = new Date(dueDate);

                if (Number.isNaN(parsed.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid due date",
                    });
                }

                data.dueDate = parsed;
            }
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No task fields provided",
            });
        }

        const task = await taskService.updateTask({
            taskId: req.params.taskId,
            columnId: req.column.id,
            expectedVersion,
            data,
        });

        if (task === "CONFLICT") {
            return res.status(409).json({
                success: false,
                message: "Task was modified by another user. Refresh and retry.",
            });
        }

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to update task",
        });
    }
};

export const deleteTaskController = async (req, res) => {
    try {
        const deleted = await taskService.deleteTask(
            req.column.id,
            req.params.taskId
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete task",
        });
    }
};

export const moveTaskController = async (req, res) => {
    try {
        const {
            destinationColumnId,
            destinationPosition,
            expectedVersion,
        } = req.body || {};

        if (
            typeof destinationColumnId !== "string" ||
            !Number.isInteger(destinationPosition) ||
            destinationPosition < 0 ||
            !Number.isInteger(expectedVersion) ||
            expectedVersion < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid movement data",
            });
        }

        const result = await taskService.moveTask({
            taskId: req.params.taskId,
            sourceColumnId: req.column.id,
            destinationColumnId,
            destinationPosition,
            expectedVersion,
            boardId: req.board.id,
        });

        if (result.status === "NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Task or destination column not found",
            });
        }

        if (result.status === "CONFLICT") {
            return res.status(409).json({
                success: false,
                message: "Task was changed by another user. Refresh and retry.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task moved successfully",
            task: result.task,
        });
    } catch (error) {
        console.error("Move task error:", error);

        if (error.code === "P2034") {
            return res.status(409).json({
                success: false,
                message: "Concurrent movement detected. Refresh and retry.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to move task",
        });
    }
};

export const reorderTasksController = async (req, res) => {
    try {
        const { taskIds } = req.body || {};

        if (
            !Array.isArray(taskIds) ||
            !taskIds.every((id) => typeof id === "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid taskIds array is required",
            });
        }

        const tasks = await taskService.reorderTasks({
            boardId: req.board.id,
            columnId: req.column.id,
            taskIds,
        });

        if (tasks === null) {
            return res.status(404).json({
                success: false,
                message: "Column not found",
            });
        }

        if (tasks === "INVALID_ORDER") {
            return res.status(400).json({
                success: false,
                message: "Task IDs must exactly match this column's tasks",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tasks reordered successfully",
            tasks,
        });
    } catch (error) {
        console.error("Reorder tasks error:", error);

        if (error.code === "P2034") {
            return res.status(409).json({
                success: false,
                message: "Concurrent reorder detected. Refresh and retry.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to reorder tasks",
        });
    }
};
