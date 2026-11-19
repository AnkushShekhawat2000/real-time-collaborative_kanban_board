import * as taskService from "../services/task.service.js";
import {
    createTaskSchema,
    updateTaskSchema,
} from "../validators/task.validator.js";

const formatValidationErrors = (error) => error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
}));

const emitTaskEvent = (req, event, data) => {
    req.app.get("io")
        .to(`tenant:${req.tenant.id}`)
        .emit(event, {
            ...data,
            tenantId: req.tenant.id,
            boardId: req.board.id,
            actorId: req.user.userId,
        });
};

export const createTaskController = async (req, res) => {
    try {
        const validation = createTaskSchema.safeParse(req.body || {});

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Task validation failed",
                errors: formatValidationErrors(validation.error),
            });
        }

        const {
            title,
            description,
            priority,
            dueDate,
        } = validation.data;
        const task = await taskService.createTask({
            columnId: req.column.id,
            title,
            description,
            priority,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            tenantId: req.tenant.id,
            userId: req.user.userId,
        });

        emitTaskEvent(req, "task:created", task);

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        console.error(error);

        if (error.code === "P2034" || error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Task order changed concurrently. Refresh and retry.",
            });
        }

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
        const validation = updateTaskSchema.safeParse(req.body || {});

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Task validation failed",
                errors: formatValidationErrors(validation.error),
            });
        }

        const {
            title,
            description,
            priority,
            dueDate,
            expectedVersion,
        } = validation.data;

        const data = {};

        if (title !== undefined) {
            data.title = title;
        }

        if (description !== undefined) {
            data.description = description;
        }

        if (priority !== undefined) {
            data.priority = priority;
        }

        if (dueDate !== undefined) {
            data.dueDate = dueDate === null ? null : new Date(dueDate);
        }

        const task = await taskService.updateTask({
            taskId: req.params.taskId,
            columnId: req.column.id,
            tenantId: req.tenant.id,
            userId: req.user.userId,
            expectedVersion,
            data,
        });

        if (task === "CONFLICT") {
            return res.status(409).json({
                success: false,
                code: "VERSION_CONFLICT",
                message: "Task was modified by another user. Refresh and retry.",
            });
        }

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        emitTaskEvent(req, "task:updated", task);

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
        const { expectedVersion } = req.body || {};

        if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
            return res.status(400).json({
                success: false,
                message: "A valid expectedVersion is required",
            });
        }

        const result = await taskService.deleteTask({
            columnId: req.column.id,
            taskId: req.params.taskId,
            tenantId: req.tenant.id,
            userId: req.user.userId,
            expectedVersion,
        });

        if (result.status === "NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        if (result.status === "CONFLICT") {
            return res.status(409).json({
                success: false,
                code: "VERSION_CONFLICT",
                message: "Task changed before deletion. Refresh and retry.",
            });
        }

        emitTaskEvent(req, "task:deleted", {
            id: req.params.taskId,
            columnId: req.column.id,
        });

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
            tenantId: req.tenant.id,
            userId: req.user.userId,
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

        emitTaskEvent(req, "task:moved", {
            ...result.task,
            sourceColumnId: req.column.id,
            destinationColumnId,
        });

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
            tenantId: req.tenant.id,
            userId: req.user.userId,
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

        emitTaskEvent(req, "task:reordered", {
            columnId: req.column.id,
            taskIds: tasks.map((task) => task.id),
        });

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

export const assignTaskController = async (req, res) => {
    try {
        const { assigneeId } = req.body || {};

        if (
            typeof assigneeId !== "string" ||
            !assigneeId.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid assigneeId is required",
            });
        }

        const result = await taskService.assignTask({
            taskId: req.params.taskId,
            columnId: req.column.id,
            tenantId: req.tenant.id,
            assigneeId,
            userId: req.user.userId,
        });

        if (result.status === "TASK_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        if (result.status === "INVALID_ASSIGNEE") {
            return res.status(400).json({
                success: false,
                message: "User is not a member of this tenant",
            });
        }

        if (result.status === "CONFLICT") {
            return res.status(409).json({
                success: false,
                message: "Task changed during assignment. Refresh and retry.",
            });
        }

        emitTaskEvent(req, "task:assigned", result.task);

        return res.status(200).json({
            success: true,
            message: "Task assigned successfully",
            task: result.task,
        });
    } catch (error) {
        console.error("Assign task error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign task",
        });
    }
};

export const unassignTaskController = async (req, res) => {
    try {
        const result = await taskService.unassignTask({
            taskId: req.params.taskId,
            columnId: req.column.id,
            tenantId: req.tenant.id,
            userId: req.user.userId,
        });

        if (result.status === "TASK_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        if (result.status === "CONFLICT") {
            return res.status(409).json({
                success: false,
                message: "Task changed. Refresh and retry.",
            });
        }

        emitTaskEvent(req, "task:assigned", result.task);

        return res.status(200).json({
            success: true,
            message: "Task unassigned successfully",
            task: result.task,
        });
    } catch (error) {
        console.error("Unassign task error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to unassign task",
        });
    }
};
