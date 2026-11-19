import express from "express";

import {
    createOrganizationController,
    deleteOrganizationController,
    getOrganizationsController,
    updateOrganizationController,
} from "../controllers/organization.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { verifyOrganizationAdmin } from "../middleware/organization.middleware.js";

const router = express.Router();

router.get("/", authenticate, getOrganizationsController);
router.post("/", authenticate, createOrganizationController);
router.put(
    "/:organizationId",
    authenticate,
    verifyOrganizationAdmin,
    updateOrganizationController
);
router.delete(
    "/:organizationId",
    authenticate,
    verifyOrganizationAdmin,
    deleteOrganizationController
);

export default router;
