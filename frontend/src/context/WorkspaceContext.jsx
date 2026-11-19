import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    createOrganization as createOrganizationRequest,
    createTenant as createTenantRequest,
    deleteOrganization as deleteOrganizationRequest,
    deleteTenant as deleteTenantRequest,
    getOrganizations,
    getTenants,
    updateOrganization as updateOrganizationRequest,
    updateTenant as updateTenantRequest,
} from "../api/workspace.api.js";
import { useAuth } from "./useAuth.js";
import WorkspaceContext from "./workspaceContext.js";

export const WorkspaceProvider = ({ children }) => {
    const { user, refreshUser } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [organizationLoading, setOrganizationLoading] = useState(false);
    const [tenantLoading, setTenantLoading] = useState(false);
    const [error, setError] = useState("");
    const membershipKey = user?.memberships?.map((membership) => (
        `${membership.organizationId}:${membership.tenantId || "organization"}:${membership.role}`
    )).join("|") || "";
    const selectOrganization = useCallback((organization) => {
        setSelectedOrganization(organization);
        setSelectedTenant(null);
        setTenants([]);
        setError("");
    }, []);

    const selectTenant = useCallback((tenant) => {
        setSelectedTenant(tenant);
    }, []);

    useEffect(() => {
        if (!user?.id) {
            return undefined;
        }

        let active = true;

        const loadOrganizations = async () => {
            setOrganizationLoading(true);
            setError("");

            try {
                const userOrganizations = await getOrganizations();

                if (active) {
                    setOrganizations(userOrganizations);

                    if (
                        selectedOrganization &&
                        !userOrganizations.some(
                            (organization) =>
                                organization.id === selectedOrganization.id
                        )
                    ) {
                        selectOrganization(null);
                    }
                }
            } catch (requestError) {
                if (active) {
                    setError(
                        requestError.response?.data?.message ||
                        "Failed to load organizations"
                    );
                }
            } finally {
                if (active) {
                    setOrganizationLoading(false);
                }
            }
        };

        loadOrganizations();

        return () => {
            active = false;
        };
    }, [
        membershipKey,
        selectOrganization,
        selectedOrganization,
        user?.id,
    ]);

    useEffect(() => {
        if (!selectedOrganization) {
            return undefined;
        }

        let active = true;

        const loadTenants = async () => {
            setTenantLoading(true);
            setError("");

            try {
                const organizationTenants = await getTenants(
                    selectedOrganization.id
                );
                const memberships = user?.memberships || [];
                const isOrganizationAdmin = memberships.some(
                    (membership) =>
                        membership.organizationId === selectedOrganization.id &&
                        membership.tenantId === null &&
                        membership.role === "ORG_ADMIN"
                );
                const tenantIds = new Set(
                    memberships
                        .filter(
                            (membership) =>
                                membership.organizationId ===
                                selectedOrganization.id &&
                                membership.tenantId
                        )
                        .map((membership) => membership.tenantId)
                );

                if (active) {
                    setTenants(
                        isOrganizationAdmin
                            ? organizationTenants
                            : organizationTenants.filter((tenant) =>
                                tenantIds.has(tenant.id)
                            )
                    );
                }
            } catch (requestError) {
                if (active) {
                    setError(
                        requestError.response?.data?.message ||
                        "Failed to load branches"
                    );
                }
            } finally {
                if (active) {
                    setTenantLoading(false);
                }
            }
        };

        loadTenants();

        return () => {
            active = false;
        };
    }, [selectedOrganization, user]);

    const createOrganization = async (name) => {
        const organization = await createOrganizationRequest(name);

        setOrganizations((current) => [
            organization,
            ...current.filter((item) => item.id !== organization.id),
        ]);
        selectOrganization(organization);
        await refreshUser();

        return organization;
    };

    const renameOrganization = async (name) => {
        if (!selectedOrganization) {
            throw new Error("Select an organization before renaming it");
        }

        const updatedOrganization = await updateOrganizationRequest(
            selectedOrganization.id,
            name
        );
        setOrganizations((current) => current.map((organization) => (
            organization.id === updatedOrganization.id
                ? updatedOrganization
                : organization
        )));
        setSelectedOrganization(updatedOrganization);
        return updatedOrganization;
    };

    const removeOrganization = async () => {
        if (!selectedOrganization) {
            throw new Error("Select an organization before deleting it");
        }

        await deleteOrganizationRequest(selectedOrganization.id);
        setOrganizations((current) => current.filter(
            (organization) => organization.id !== selectedOrganization.id
        ));
        setSelectedOrganization(null);
        setSelectedTenant(null);
        setTenants([]);
    };

    const createTenant = async (name) => {
        if (!selectedOrganization) {
            throw new Error("Select an organization before creating a branch");
        }

        const tenant = await createTenantRequest({
            organizationId: selectedOrganization.id,
            name,
        });

        setTenants((current) => [...current, tenant]);
        selectTenant(tenant);
        return tenant;
    };

    const renameTenant = async (name) => {
        if (!selectedTenant) {
            throw new Error("Select a branch before renaming it");
        }

        const updatedTenant = await updateTenantRequest(
            selectedTenant.id,
            name
        );
        setTenants((current) => current.map((tenant) => (
            tenant.id === updatedTenant.id ? updatedTenant : tenant
        )));
        setSelectedTenant(updatedTenant);
        return updatedTenant;
    };

    const removeTenant = async () => {
        if (!selectedTenant) {
            throw new Error("Select a branch before deleting it");
        }

        await deleteTenantRequest(selectedTenant.id);
        setTenants((current) => current.filter(
            (tenant) => tenant.id !== selectedTenant.id
        ));
        setSelectedTenant(null);
    };

    return (
        <WorkspaceContext.Provider
            value={{
                organizations,
                tenants,
                selectedOrganization,
                selectedTenant,
                loading: organizationLoading,
                tenantLoading,
                error,
                createOrganization,
                renameOrganization,
                removeOrganization,
                createTenant,
                renameTenant,
                removeTenant,
                selectOrganization,
                selectTenant,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};
