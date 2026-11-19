import { useState } from "react";

const NameDialog = ({
    title,
    label,
    initialName = "",
    loading = false,
    error = "",
    onClose,
    onSubmit,
}) => {
    const [name, setName] = useState(initialName);
    const [validationError, setValidationError] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmedName = name.trim();

        if (trimmedName.length < 2 || trimmedName.length > 100) {
            setValidationError("Name must be 2-100 characters.");
            return;
        }

        setValidationError("");
        onSubmit(trimmedName);
    };

    return (
        <div className="modal-overlay">
            <form
                className="name-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="name-dialog-title"
                onSubmit={handleSubmit}
            >
                <h2 id="name-dialog-title">{title}</h2>
                <label htmlFor="name-dialog-input">{label}</label>
                <input
                    id="name-dialog-input"
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                />
                {(validationError || error) && (
                    <p className="error-message">
                        {validationError || error}
                    </p>
                )}
                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NameDialog;
