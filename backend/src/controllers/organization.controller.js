import {
    createOrganization,
    deleteOrganization,
    getUserOrganizations,
    updateOrganization,
} from "../services/organization.service.js";

const isValidName = (name) => (
    typeof name === "string" &&
    name.trim().length >= 2 &&
    name.trim().length <= 100
);

export const createOrganizationController = async (req, res) => {
    try {
        const { name } = req.body || {};

        if (!isValidName(name)) {
            return res.status(400).json({
                success: false,
                message: "Organization name must be 2-100 characters",
            });
        }

        const organization = await createOrganization({
            name: name.trim(),
            userId: req.user.userId,
        });

        return res.status(201).json({
            success: true,
            organization,
            role: "ORG_ADMIN",
        });
    } catch (error) {
        console.error("Create organization error:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Organization slug already exists. Please retry.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create organization",
        });
    }
};

export const getOrganizationsController = async (req, res) => {
    try {
        const organizations = await getUserOrganizations(req.user.userId);

        return res.status(200).json({
            success: true,
            organizations,
        });
    } catch (error) {
        console.error("Get organizations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch organizations",
        });
    }
};

export const updateOrganizationController = async (req, res) => {
    try {
        const { name } = req.body || {};

        if (!isValidName(name)) {
            return res.status(400).json({
                success: false,
                message: "Organization name must be 2-100 characters",
            });
        }

        const organization = await updateOrganization(
            req.params.organizationId,
            name.trim()
        );

        return res.status(200).json({
            success: true,
            organization,
        });
    } catch (error) {
        console.error("Update organization error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update organization",
        });
    }
};

export const deleteOrganizationController = async (req, res) => {
    try {
        const deleted = await deleteOrganization(req.params.organizationId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Organization not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Organization deleted successfully",
        });
    } catch (error) {
        console.error("Delete organization error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete organization",
        });
    }
};
