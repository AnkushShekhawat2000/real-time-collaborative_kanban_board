import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { verifyTenantAccess } from "../middleware/tenant.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

import {
    createBoardController,
    getBoardsController,
    getBoardController,
    updateBoardController,
    deleteBoardController,
} from "../controllers/board.controller.js";

const router = express.Router();

router.get(
    "/:tenantId",
    authenticate,
    verifyTenantAccess,
    getBoardsController
);

router.post(
    "/",
    authenticate,
    verifyTenantAccess,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    createBoardController
);

router.get(
    "/:tenantId/:boardId",
    authenticate,
    verifyTenantAccess,
    getBoardController
);

router.put(
    "/:tenantId/:boardId",
    authenticate,
    verifyTenantAccess,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    updateBoardController
);

router.delete(
    "/:tenantId/:boardId",
    authenticate,
    verifyTenantAccess,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    deleteBoardController
);

export default router;
