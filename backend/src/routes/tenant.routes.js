import express from "express";
import {
    createTenantController,
    createTenantMemberController,
    deleteTenantController,
    deleteTenantMemberController,
    getTenantMembersController,
    getTenantsController,
    updateTenantController,
    updateTenantMemberController,
} from "../controllers/tenant.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { verifyTenantAccess } from "../middleware/tenant.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", authenticate, createTenantController);
router.get("/organization/:organizationId", authenticate, getTenantsController);
router.get("/:tenantId/members", authenticate, verifyTenantAccess, getTenantMembersController);
router.post(
    "/:tenantId/members",
    authenticate,
    verifyTenantAccess,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    createTenantMemberController
);
router.patch(
    "/:tenantId/members/:membershipId",
    authenticate,
    verifyTenantAccess,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    updateTenantMemberController
);
router.delete(
    "/:tenantId/members/:membershipId",
    authenticate,
    verifyTenantAccess,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    deleteTenantMemberController
);
router.patch(
    "/:tenantId",
    authenticate,
    verifyTenantAccess,
    allowRoles("ORG_ADMIN", "TENANT_ADMIN"),
    updateTenantController
);
router.delete(
    "/:tenantId",
    authenticate,
    verifyTenantAccess,
    allowRoles("ORG_ADMIN"),
    deleteTenantController
);

export default router;
