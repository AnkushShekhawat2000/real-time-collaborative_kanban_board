import { useCallback, useEffect, useRef, useState } from "react";

import {
    addTenantMember,
    getTenantMembers,
    removeTenantMember,
    updateTenantMember,
} from "../../api/workspace.api.js";
import { useAuth } from "../../context/useAuth.js";
import { useWorkspace } from "../../context/useWorkspace.js";

const TenantMembers = () => {
    const { user, refreshUser } = useAuth();
    const { selectedTenant } = useWorkspace();
    const requestIdRef = useRef(0);
    const [members, setMembers] = useState([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("MEMBER");
    const [loading, setLoading] = useState(false);
    const [loadedTenantId, setLoadedTenantId] = useState(null);
    const [error, setError] = useState("");

    const organizationAdmin = user?.memberships?.some(
        (membership) =>
            membership.organizationId === selectedTenant?.organizationId &&
            membership.tenantId === null &&
            membership.role === "ORG_ADMIN"
    );
    const tenantAdmin = user?.memberships?.some(
        (membership) =>
            membership.tenantId === selectedTenant?.id &&
            membership.role === "TENANT_ADMIN"
    );
    const canManageMembers = organizationAdmin || tenantAdmin;

    const loadMembers = useCallback(async () => {
        if (!selectedTenant) {
            return;
        }

        setLoading(true);
        setError("");

        const tenantId = selectedTenant.id;
        const requestId = ++requestIdRef.current;

        try {
            const result = await getTenantMembers(tenantId);
            if (requestId !== requestIdRef.current) {
                return;
            }
            setMembers(result);
            setLoadedTenantId(tenantId);
        } catch (requestError) {
            if (requestId !== requestIdRef.current) {
                return;
            }
            setError(
                requestError.response?.data?.message ||
                "Failed to load branch members"
            );
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [selectedTenant]);

    useEffect(() => {
        if (!selectedTenant) {
            return undefined;
        }

        let active = true;
        const requestId = ++requestIdRef.current;

        getTenantMembers(selectedTenant.id)
            .then((result) => {
                if (active && requestId === requestIdRef.current) {
                    setMembers(result);
                    setLoadedTenantId(selectedTenant.id);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (active && requestId === requestIdRef.current) {
                    setError(
                        requestError.response?.data?.message ||
                        "Failed to load branch members"
                    );
                    setLoadedTenantId(selectedTenant.id);
                }
            })
            .finally(() => {
                if (active && requestId === requestIdRef.current) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [selectedTenant]);

    const handleAddMember = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            await addTenantMember(selectedTenant.id, {
                email: email.trim(),
                role: organizationAdmin ? role : "MEMBER",
            });
            setEmail("");
            await refreshUser();
            await loadMembers();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to add branch member"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (membership, nextRole) => {
        setLoading(true);
        setError("");

        try {
            await updateTenantMember(
                selectedTenant.id,
                membership.id,
                nextRole
            );
            await refreshUser();
            await loadMembers();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to update member role"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (membership) => {
        if (!window.confirm(`Remove ${membership.user.name} from this branch?`)) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            await removeTenantMember(selectedTenant.id, membership.id);
            await refreshUser();
            await loadMembers();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to remove branch member"
            );
        } finally {
            setLoading(false);
        }
    };

    if (!selectedTenant) {
        return null;
    }

    return (
        <section className="tenant-members" aria-label="Branch members">
            {canManageMembers && (
                <form className="member-form" onSubmit={handleAddMember}>
                    <label htmlFor="member-email">Add registered user by email</label>
                    <input
                        id="member-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="user@example.com"
                        required
                    />
                    {organizationAdmin && (
                        <>
                            <label htmlFor="member-role">Role</label>
                            <select
                                id="member-role"
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                            >
                                <option value="MEMBER">Member</option>
                                <option value="TENANT_ADMIN">Tenant Admin</option>
                            </select>
                        </>
                    )}
                    <button type="submit" disabled={loading}>
                        Add Member
                    </button>
                </form>
            )}

            {(loading || loadedTenantId !== selectedTenant.id) &&
                <p>Loading members...</p>}
            {!loading && loadedTenantId === selectedTenant.id &&
                members.length === 0 && (
                <p>No members have been added to this branch yet.</p>
            )}
            {loadedTenantId === selectedTenant.id && members.length > 0 && (
                <ul className="member-list">
                    {members.map((membership) => (
                        <li key={membership.id}>
                            <div>
                                <strong>{membership.user.name}</strong>
                                <span>{membership.user.email}</span>
                            </div>
                            {organizationAdmin ? (
                                <select
                                    aria-label={`Role for ${membership.user.name}`}
                                    value={membership.role}
                                    disabled={loading}
                                    onChange={(event) => {
                                        void handleRoleChange(
                                            membership,
                                            event.target.value
                                        );
                                    }}
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="TENANT_ADMIN">
                                        Tenant Admin
                                    </option>
                                </select>
                            ) : (
                                <span>{membership.role.replace("_", " ")}</span>
                            )}
                            {canManageMembers && (
                                <button
                                    type="button"
                                    className="danger-button"
                                    disabled={
                                        loading ||
                                        (!organizationAdmin &&
                                            membership.role !== "MEMBER")
                                    }
                                    onClick={() => void handleRemove(membership)}
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {error && <p className="error-message">{error}</p>}
        </section>
    );
};

export default TenantMembers;
