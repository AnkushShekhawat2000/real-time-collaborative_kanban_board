import { useState } from "react";

import { useAuth } from "../../context/useAuth.js";
import { useWorkspace } from "../../context/useWorkspace.js";

const TenantManagement = () => {
    const { user } = useAuth();
    const {
        selectedOrganization,
        selectedTenant,
        createTenant,
        renameTenant,
        removeTenant,
    } = useWorkspace();
    const [newName, setNewName] = useState("");
    const [editName, setEditName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isOrganizationAdmin = user?.memberships?.some(
        (membership) =>
            membership.organizationId === selectedOrganization?.id &&
            membership.tenantId === null &&
            membership.role === "ORG_ADMIN"
    );
    const canManageBranch = isOrganizationAdmin || user?.memberships?.some(
        (membership) =>
            membership.tenantId === selectedTenant?.id &&
            membership.role === "TENANT_ADMIN"
    );

    const handleCreate = async (event) => {
        event.preventDefault();
        const name = newName.trim();

        if (name.length < 2 || name.length > 100) {
            setError("Branch name must be 2-100 characters.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await createTenant(name);
            setNewName("");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Failed to create branch"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRename = async (event) => {
        event.preventDefault();
        const name = editName.trim();

        if (name.length < 2 || name.length > 100) {
            setError("Branch name must be 2-100 characters.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await renameTenant(name);
            setEditName("");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Failed to rename branch"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(
            "Delete this branch and all its boards, tasks, memberships, and activity?"
        )) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            await removeTenant();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Failed to delete branch"
            );
        } finally {
            setLoading(false);
        }
    };

    if (!selectedOrganization) {
        return null;
    }

    return (
        <section className="tenant-management">
            {isOrganizationAdmin && (
                <form onSubmit={handleCreate}>
                    <label htmlFor="new-tenant">Create branch</label>
                    <input
                        id="new-tenant"
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Branch name"
                        minLength={2}
                        maxLength={100}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        Create Branch
                    </button>
                </form>
            )}

            {selectedTenant && canManageBranch && (
                <form onSubmit={handleRename}>
                    <label htmlFor="rename-tenant">Rename selected branch</label>
                    <input
                        id="rename-tenant"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        placeholder={selectedTenant.name}
                        minLength={2}
                        maxLength={100}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        Rename Branch
                    </button>
                </form>
            )}

            {selectedTenant && isOrganizationAdmin && (
                <button
                    type="button"
                    className="danger-button"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    Delete Branch
                </button>
            )}
            {error && <p className="error-message">{error}</p>}
        </section>
    );
};

export default TenantManagement;
