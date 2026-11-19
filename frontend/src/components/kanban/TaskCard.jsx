import { useState } from "react";
import {
    Calendar,
    Pencil,
    Trash2,
} from "lucide-react";

const priorityColors = {
    LOW: "#16a34a",
    MEDIUM: "#d97706",
    HIGH: "#ea580c",
    URGENT: "#dc2626",
};

const TaskCard = ({
    task,
    onEdit,
    onDelete,
    onOpen,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <article className="task-card">
            <div className="task-card-header">
                <span
                    className="priority-badge"
                    style={{
                        color: priorityColors[task.priority] || "#64748b",
                    }}
                >
                    {task.priority || "MEDIUM"}
                </span>

                <button
                    type="button"
                    className="icon-button"
                    aria-label="Task actions"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    ⋮
                </button>

                {menuOpen && (
                    <div className="task-menu">
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                onEdit(task);
                            }}
                        >
                            <Pencil size={14} /> Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                onDelete(task);
                            }}
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                )}
            </div>

            <button
                type="button"
                className="task-card-content"
                onClick={() => onOpen(task)}
            >
                <h4>{task.title}</h4>
                <p>{task.description || "No description"}</p>

                {task.dueDate && (
                    <div className="task-card-footer">
                        <span>
                            <Calendar size={14} />
                            {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                    </div>
                )}
            </button>
        </article>
    );
};

export default TaskCard;
