import { useState } from "react";

const TaskModal = ({
    onClose,
    onSubmit,
    initialTask,
    loading,
    error,
}) => {
    const [form, setForm] = useState(() => ({
        title: initialTask?.title || "",
        description: initialTask?.description || "",
        priority: initialTask?.priority || "MEDIUM",
        dueDate: initialTask?.dueDate
            ? String(initialTask.dueDate).slice(0, 10)
            : "",
    }));

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            title: form.title.trim(),
            description: form.description,
            priority: form.priority,
            dueDate: form.dueDate || null,
        });
    };

    return (
        <div className="modal-overlay">
            <section
                className="task-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-modal-title"
            >
                <h2 id="task-modal-title">
                    {initialTask ? "Edit Task" : "Create Task"}
                </h2>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="task-title">Task Title</label>
                    <input
                        id="task-title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Enter task title"
                        minLength={2}
                        maxLength={200}
                        required
                    />

                    <label htmlFor="task-description">Description</label>
                    <textarea
                        id="task-description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Describe your task"
                    />

                    <label htmlFor="task-priority">Priority</label>
                    <select
                        id="task-priority"
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>

                    <label htmlFor="task-due-date">Due Date</label>
                    <input
                        id="task-due-date"
                        type="date"
                        name="dueDate"
                        value={form.dueDate}
                        onChange={handleChange}
                    />

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading
                                ? "Saving..."
                                : initialTask
                                    ? "Update Task"
                                    : "Create Task"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default TaskModal;
