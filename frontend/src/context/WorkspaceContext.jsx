import {
    useEffect,
    useState,
} from "react";

import {
    getOrganizations,
    getTenants,
} from "../api/workspace.api.js";
import { useAuth } from "./useAuth.js";
import WorkspaceContext from "./workspaceContext.js";

export const WorkspaceProvider = ({ children }) => {
    const { user } = useAuth();
    const organizations = getOrganizations(user?.memberships || []);
    const [tenants, setTenants] = useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenantLoading, setTenantLoading] = useState(false);
    const [error, setError] = useState("");

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

    const selectOrganization = (organization) => {
        setSelectedOrganization(organization);
        setSelectedTenant(null);
        setTenants([]);
        setError("");
    };

    const selectTenant = (tenant) => {
        setSelectedTenant(tenant);
    };

    return (
        <WorkspaceContext.Provider
            value={{
                organizations,
                tenants,
                selectedOrganization,
                selectedTenant,
                loading: false,
                tenantLoading,
                error,
                selectOrganization,
                selectTenant,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};
