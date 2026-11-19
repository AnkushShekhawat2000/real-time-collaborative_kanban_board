import express from "express";
import { createTenantController, getTenantsController } from "../controllers/tenant.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createTenantController);
router.get("/organization/:organizationId", authenticate, getTenantsController);

export default router;
