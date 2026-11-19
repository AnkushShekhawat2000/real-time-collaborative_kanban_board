import { useState } from "react";

import { useAuth } from "../../context/useAuth.js";
import { useWorkspace } from "../../context/useWorkspace.js";
import NameDialog from "../common/NameDialog.jsx";

const CreateOrganization = () => {
    const { user } = useAuth();
    const {
        organizations,
        selectedOrganization,
        createOrganization,
        renameOrganization,
        removeOrganization,
        loading,
    } = useWorkspace();
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameError, setRenameError] = useState("");
    const canManageOrganization = user?.memberships?.some(
        (membership) =>
            membership.organizationId === selectedOrganization?.id &&
            membership.tenantId === null &&
            membership.role === "ORG_ADMIN"
    );

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const organizationName = name.trim();

        if (organizationName.length < 2 || organizationName.length > 100) {
            setError("Organization name must be 2-100 characters.");
            return;
        }

        setSaving(true);

        try {
            await createOrganization(organizationName);
            setName("");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to create organization"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleRename = async (nextName) => {
        setSaving(true);
        setError("");
        setRenameError("");

        try {
            await renameOrganization(nextName);
            setRenameOpen(false);
        } catch (requestError) {
            const message =
                requestError.response?.data?.message ||
                "Failed to rename organization";
            setError(message);
            setRenameError(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(
            "Delete this organization and all its branches, boards, tasks, and memberships?"
        )) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            await removeOrganization();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to delete organization"
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <form
                className="create-organization-form"
                onSubmit={handleSubmit}
            >
                <label htmlFor="new-organization">
                    Create organization
                </label>
                <input
                    id="new-organization"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Organization name"
                    minLength={2}
                    maxLength={100}
                    required
                />
                <button type="submit" disabled={saving || loading}>
                    {saving ? "Creating..." : "Create Organization"}
                </button>
                {canManageOrganization && selectedOrganization && (
                    <div className="organization-actions">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                                setRenameError("");
                                setRenameOpen(true);
                            }}
                        >
                            Rename Selected
                        </button>
                        <button
                            type="button"
                            className="danger-button"
                            disabled={saving}
                            onClick={() => void handleDelete()}
                        >
                            Delete Selected
                        </button>
                    </div>
                )}
                {organizations.length > 1 && (
                    <small>Select an organization above to manage it.</small>
                )}
                {error && <p className="error-message">{error}</p>}
            </form>
            {renameOpen && (
                <NameDialog
                    title="Rename organization"
                    label="Organization name"
                    initialName={selectedOrganization?.name || ""}
                    loading={saving}
                    error={renameError}
                    onClose={() => setRenameOpen(false)}
                    onSubmit={handleRename}
                />
            )}
        </>
    );
};

export default CreateOrganization;
