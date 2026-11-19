import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { verifyTenantAccess } from "../middleware/tenant.middleware.js";
import { verifyBoardAccess } from "../middleware/board.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

import {
    createColumnController,
    getColumnsController,
    getColumnController,
    updateColumnController,
    deleteColumnController,
    reorderColumnsController,
} from "../controllers/column.controller.js";

const router = express.Router();

const authorizeBoard = [
    authenticate,
    verifyTenantAccess,
    verifyBoardAccess,
];

router.get(
    "/:tenantId/:boardId",
    authorizeBoard,
    getColumnsController
);

router.post(
    "/",
    authenticate,
    verifyTenantAccess,
    verifyBoardAccess,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    createColumnController
);

router.get(
    "/:tenantId/:boardId/:columnId",
    authorizeBoard,
    getColumnController
);

router.put(
    "/:tenantId/:boardId/:columnId",
    authorizeBoard,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    updateColumnController
);

router.delete(
    "/:tenantId/:boardId/:columnId",
    authorizeBoard,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    deleteColumnController
);

router.patch(
    "/:tenantId/:boardId/reorder",
    authorizeBoard,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    reorderColumnsController
);

export default router;
