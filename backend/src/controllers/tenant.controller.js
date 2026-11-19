import prisma from "../config/prisma.js";
import {
    createTenant,
    getOrganizationTenants,
} from "../services/tenant.service.js";

export const createTenantController = async (req, res) => {
    try {
        const { organizationId, name } = req.body || {};

        if (
            typeof organizationId !== "string" ||
            !organizationId ||
            typeof name !== "string" ||
            name.trim().length < 2
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid organization ID and tenant name required",
            });
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: req.user.userId,
                organizationId,
                tenantId: null,
                role: "ORG_ADMIN",
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "Only organization admins can create tenants",
            });
        }

        const tenantName = name.trim();
        const slug = tenantName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Tenant name must contain letters or numbers",
            });
        }

        const tenant = await createTenant({
            organizationId,
            name: tenantName,
            slug,
        });

        return res.status(201).json({
            success: true,
            message: "Tenant created successfully",
            tenant,
        });
    } catch (error) {
        console.error("Create tenant error:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "A tenant with this name already exists in the organization",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create tenant",
        });
    }
};

export const getTenantsController = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const membership = await prisma.membership.findFirst({
            where: {
                userId: req.user.userId,
                organizationId,
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "Organization access denied",
            });
        }

        const tenants = await getOrganizationTenants(organizationId);

        return res.status(200).json({
            success: true,
            count: tenants.length,
            tenants,
        });
    } catch (error) {
        console.error("Get tenants error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch tenants",
        });
    }
};
