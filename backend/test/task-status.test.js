import assert from "node:assert/strict";
import test from "node:test";

import { statusForColumn } from "../src/services/taskStatus.js";

test("default Kanban columns map to task statuses", () => {
    assert.equal(statusForColumn("To Do"), "TODO");
    assert.equal(statusForColumn("In Progress"), "IN_PROGRESS");
    assert.equal(statusForColumn("Done"), "DONE");
});

test("custom columns preserve the task's current status", () => {
    assert.equal(statusForColumn("Review", "IN_PROGRESS"), "IN_PROGRESS");
});
