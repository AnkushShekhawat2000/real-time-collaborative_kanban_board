import { useState } from "react";

import { createBoard } from "../../api/workspace.api.js";
import { useWorkspace } from "../../context/useWorkspace.js";

const CreateBoard = ({ onCreated }) => {
    const { selectedTenant } = useWorkspace();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!selectedTenant) {
            setError("Please select a branch first");
            return;
        }

        if (!name.trim()) {
            return;
        }

        setLoading(true);

        try {
            const board = await createBoard({
                name: name.trim(),
                tenantId: selectedTenant.id,
            });

            if (!board?.id) {
                throw new Error("Invalid board response");
            }

            setName("");
            onCreated?.(board);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Failed to create board"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="create-board-form" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Enter board name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={100}
                required
            />
            <button disabled={loading || !selectedTenant}>
                {loading ? "Creating..." : "Create Board"}
            </button>
            {error && <p className="error-message">{error}</p>}
        </form>
    );
};

export default CreateBoard;
