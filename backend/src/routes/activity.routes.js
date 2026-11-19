import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { verifyTenantAccess } from "../middleware/tenant.middleware.js";
import { getActivitiesController } from "../controllers/activity.controller.js";

const router = express.Router();

router.get(
    "/:tenantId",
    authenticate,
    verifyTenantAccess,
    getActivitiesController
);

export default router;
