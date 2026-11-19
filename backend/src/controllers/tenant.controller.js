import prisma from "../config/prisma.js";
import {
    createTenant,
    createTenantMember,
    deleteTenant,
    deleteTenantMember,
    getOrganizationTenants,
    getTenantById,
    getTenantMembers,
    updateTenant,
    updateTenantMemberRole,
} from "../services/tenant.service.js";
import {
    revokeTenantRoom,
    revokeTenantUserAccess,
} from "../socket/socket.js";

export const createTenantController = async (req, res) => {
    try {
        const { organizationId, name } = req.body || {};

        if (
            typeof organizationId !== "string" ||
            !organizationId ||
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
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

        const memberships = await prisma.membership.findMany({
            where: {
                userId: req.user.userId,
                organizationId,
            },
            select: {
                tenantId: true,
                role: true,
            },
        });

        const isOrganizationAdmin = memberships.some(
            (membership) =>
                membership.tenantId === null &&
                membership.role === "ORG_ADMIN"
        );
        const tenantIds = memberships
            .filter(
                (membership) =>
                    membership.tenantId &&
                    ["TENANT_ADMIN", "MEMBER"].includes(membership.role)
            )
            .map((membership) => membership.tenantId);

        if (!isOrganizationAdmin && tenantIds.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Organization access denied",
            });
        }

        const tenants = await getOrganizationTenants(
            organizationId,
            isOrganizationAdmin ? undefined : tenantIds
        );

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

export const updateTenantController = async (req, res) => {
    try {
        const { name } = req.body || {};

        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Tenant name must be 2-100 characters",
            });
        }

        const tenant = await updateTenant(req.tenant.id, name.trim());

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tenant updated successfully",
            tenant,
        });
    } catch (error) {
        console.error("Update tenant error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update tenant",
        });
    }
};

export const deleteTenantController = async (req, res) => {
    try {
        const deleted = await deleteTenant(req.tenant.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        await revokeTenantRoom(req.app.get("io"), req.tenant.id);

        return res.status(200).json({
            success: true,
            message: "Tenant and its data deleted successfully",
        });
    } catch (error) {
        console.error("Delete tenant error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete tenant",
        });
    }
};

export const getTenantMembersController = async (req, res) => {
    try {
        const members = await getTenantMembers(req.tenant.id);

        return res.status(200).json({
            success: true,
            count: members.length,
            members,
        });
    } catch (error) {
        console.error("Get tenant members error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch tenant members",
        });
    }
};

const respondToMembershipResult = (res, result) => {
    const responses = {
        FORBIDDEN: [403, "Tenant admins can only manage regular members"],
        INVALID_ROLE: [400, "Role must be MEMBER or TENANT_ADMIN"],
        LAST_TENANT_ADMIN: [409, "A tenant must keep at least one tenant admin"],
        MEMBERSHIP_NOT_FOUND: [404, "Tenant membership not found"],
        TENANT_NOT_FOUND: [404, "Tenant not found"],
        USER_NOT_FOUND: [404, "No registered user found with that email"],
    };
    const response = responses[result.status];

    if (response) {
        return res.status(response[0]).json({
            success: false,
            message: response[1],
        });
    }

    return res.status(500).json({
        success: false,
        message: "Unable to process tenant membership request",
    });
};

export const createTenantMemberController = async (req, res) => {
    try {
        const { email, role = "MEMBER" } = req.body || {};

        if (
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid user email is required",
            });
        }

        const result = await createTenantMember({
            tenantId: req.tenant.id,
            email: email.trim().toLowerCase(),
            role,
            actorRole: req.membership.role,
        });

        if (result.status !== "SUCCESS") {
            return respondToMembershipResult(res, result);
        }

        return res.status(201).json({
            success: true,
            message: "Tenant member added successfully",
            membership: result.membership,
        });
    } catch (error) {
        console.error("Add tenant member error:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "User is already a member of this tenant",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add tenant member",
        });
    }
};

export const updateTenantMemberController = async (req, res) => {
    try {
        const { role } = req.body || {};
        const result = await updateTenantMemberRole({
            tenantId: req.tenant.id,
            membershipId: req.params.membershipId,
            role,
            actorRole: req.membership.role,
        });

        if (result.status !== "SUCCESS") {
            return respondToMembershipResult(res, result);
        }

        return res.status(200).json({
            success: true,
            message: "Tenant member role updated successfully",
            membership: result.membership,
        });
    } catch (error) {
        console.error("Update tenant member error:", error);

        if (error.code === "P2034") {
            return res.status(409).json({
                success: false,
                message: "Membership changed concurrently. Refresh and retry.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update tenant member",
        });
    }
};

export const deleteTenantMemberController = async (req, res) => {
    try {
        const result = await deleteTenantMember({
            tenantId: req.tenant.id,
            membershipId: req.params.membershipId,
            actorRole: req.membership.role,
        });

        if (result.status !== "SUCCESS") {
            return respondToMembershipResult(res, result);
        }

        const organizationAdminMembership = await prisma.membership.findFirst({
            where: {
                userId: result.userId,
                organizationId: result.organizationId,
                tenantId: null,
                role: "ORG_ADMIN",
            },
            select: { id: true },
        });

        if (!organizationAdminMembership) {
            await revokeTenantUserAccess(
                req.app.get("io"),
                req.tenant.id,
                result.userId
            );
        }

        return res.status(200).json({
            success: true,
            message: "Tenant member removed successfully",
        });
    } catch (error) {
        console.error("Remove tenant member error:", error);

        if (error.code === "P2034") {
            return res.status(409).json({
                success: false,
                message: "Membership changed concurrently. Refresh and retry.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to remove tenant member",
        });
    }
};
