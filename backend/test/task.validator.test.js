import assert from "node:assert/strict";
import test from "node:test";

import {
    createTaskSchema,
    updateTaskSchema,
} from "../src/validators/task.validator.js";

const validCreateTask = {
    tenantId: "tenant-1",
    boardId: "board-1",
    columnId: "column-1",
    title: "  Ship milestone  ",
};

test("create task trims title and defaults priority", () => {
    const result = createTaskSchema.safeParse(validCreateTask);

    assert.equal(result.success, true);
    assert.equal(result.data.title, "Ship milestone");
    assert.equal(result.data.priority, "MEDIUM");
});

test("create task rejects unsupported priority and invalid calendar date", () => {
    const invalidPriority = createTaskSchema.safeParse({
        ...validCreateTask,
        priority: "BLOCKER",
    });
    const invalidDate = createTaskSchema.safeParse({
        ...validCreateTask,
        dueDate: "2025-02-29",
    });

    assert.equal(invalidPriority.success, false);
    assert.equal(invalidDate.success, false);
});

test("task update requires a version and at least one changed field", () => {
    assert.equal(
        updateTaskSchema.safeParse({ title: "Updated" }).success,
        false
    );
    assert.equal(
        updateTaskSchema.safeParse({ expectedVersion: 1 }).success,
        false
    );
    assert.equal(
        updateTaskSchema.safeParse({
            expectedVersion: 1,
            title: "Updated",
        }).success,
        true
    );
});
