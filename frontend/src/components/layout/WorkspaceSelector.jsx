import { useWorkspace } from "../../context/useWorkspace.js";

const WorkspaceSelector = () => {
    const {
        organizations,
        tenants,
        selectedOrganization,
        selectedTenant,
        selectOrganization,
        selectTenant,
        loading,
        tenantLoading,
        error,
    } = useWorkspace();

    if (loading) {
        return <p>Loading workspaces...</p>;
    }

    return (
        <div className="workspace-selector">
            <label htmlFor="organization">Organization</label>
            <select
                id="organization"
                value={selectedOrganization?.id || ""}
                onChange={(event) => {
                    const organization = organizations.find(
                        (item) => item.id === event.target.value
                    );

                    if (organization) {
                        selectOrganization(organization);
                    }
                }}
            >
                <option value="">Select Organization</option>
                {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                        {organization.name}
                    </option>
                ))}
            </select>

            <label htmlFor="tenant">Branch / Tenant</label>
            <select
                id="tenant"
                value={selectedTenant?.id || ""}
                disabled={!selectedOrganization || tenantLoading}
                onChange={(event) => {
                    const tenant = tenants.find(
                        (item) => item.id === event.target.value
                    );

                    if (tenant) {
                        selectTenant(tenant);
                    }
                }}
            >
                <option value="">
                    {tenantLoading ? "Loading branches..." : "Select Branch"}
                </option>
                {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                    </option>
                ))}
            </select>

            {organizations.length === 0 && (
                <p>You do not have an organization membership yet.</p>
            )}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default WorkspaceSelector;
