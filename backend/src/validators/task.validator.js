import { z } from "zod";

const dateOnlySchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        return (
            !Number.isNaN(parsed.getTime()) &&
            parsed.toISOString().slice(0, 10) === value
        );
    }, "Invalid due date");

const dueDateSchema = z.union([
    dateOnlySchema,
    z.string().datetime({ offset: true }),
]).nullable().optional();

const taskFields = {
    title: z.string().trim().min(2).max(200),
    description: z.string().max(2000).nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    dueDate: dueDateSchema,
};

export const createTaskSchema = z.object({
    ...taskFields,
    priority: taskFields.priority.default("MEDIUM"),
    tenantId: z.string().min(1),
    boardId: z.string().min(1),
    columnId: z.string().min(1),
});

export const updateTaskSchema = z.object({
    expectedVersion: z.number().int().positive(),
    title: taskFields.title.optional(),
    description: taskFields.description,
    priority: taskFields.priority.optional(),
    dueDate: dueDateSchema,
}).refine(
    (data) => (
        data.title !== undefined ||
        data.description !== undefined ||
        data.priority !== undefined ||
        data.dueDate !== undefined
    ),
    {
        message: "Provide at least one task field",
    }
);
