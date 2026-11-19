import {
    Calendar,
    Flag,
    X,
} from "lucide-react";

const TaskDetail = ({
    task,
    members,
    assigning,
    error,
    onAssign,
    onClose,
}) => {
    if (!task) {
        return null;
    }

    return (
        <div className="detail-overlay">
            <section className="task-detail" role="dialog" aria-modal="true">
                <div className="detail-header">
                    <h2>Task Details</h2>
                    <button
                        type="button"
                        aria-label="Close task details"
                        onClick={onClose}
                    >
                        <X />
                    </button>
                </div>

                <h3>{task.title}</h3>
                <p>{task.description || "No description available"}</p>

                <div className="detail-field">
                    <Flag size={18} />
                    <span>Priority: {task.priority || "MEDIUM"}</span>
                </div>

                <div className="detail-field">
                    <span>Status: {task.status?.replace("_", " ") || "TODO"}</span>
                </div>

                <div className="detail-field">
                    <Calendar size={18} />
                    <span>
                        Due Date: {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : "Not set"}
                    </span>
                </div>

                <div className="detail-field">
                    <span>Column: {task.column?.name || "Not available"}</span>
                </div>
                <div className="detail-field">
                    <label htmlFor="task-assignee">Assignee</label>
                    <select
                        id="task-assignee"
                        value={task.assigneeId || ""}
                        disabled={assigning}
                        onChange={(event) => {
                            void onAssign(event.target.value || null);
                        }}
                    >
                        <option value="">Unassigned</option>
                        {members.map((membership) => (
                            <option
                                key={membership.user.id}
                                value={membership.user.id}
                            >
                                {membership.user.name} ({membership.role})
                            </option>
                        ))}
                    </select>
                </div>
                {error && <p className="error-message">{error}</p>}
                <div className="detail-field">
                    <span>Task ID: {task.id}</span>
                </div>

                <button type="button" onClick={onClose}>
                    Close
                </button>
            </section>
        </div>
    );
};

export default TaskDetail;
