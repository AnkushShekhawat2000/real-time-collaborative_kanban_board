import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { verifyTenantAccess } from "../middleware/tenant.middleware.js";
import { verifyBoardAccess } from "../middleware/board.middleware.js";
import { verifyColumnAccess } from "../middleware/column.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

import {
    createTaskController,
    getTasksController,
    getTaskController,
    updateTaskController,
    deleteTaskController,
} from "../controllers/task.controller.js";

const router = express.Router();

const verifyHierarchy = [
    authenticate,
    verifyTenantAccess,
    verifyBoardAccess,
    verifyColumnAccess,
];

router.get(
    "/:tenantId/:boardId/:columnId",
    verifyHierarchy,
    getTasksController
);

router.post(
    "/",
    verifyHierarchy,
    createTaskController
);

router.get(
    "/:tenantId/:boardId/:columnId/:taskId",
    verifyHierarchy,
    getTaskController
);

router.patch(
    "/:tenantId/:boardId/:columnId/:taskId",
    verifyHierarchy,
    updateTaskController
);

router.delete(
    "/:tenantId/:boardId/:columnId/:taskId",
    verifyHierarchy,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN", "MEMBER"),
    deleteTaskController
);

export default router;
