import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import TaskCard from "./TaskCard.jsx";

const SortableTask = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <TaskCard {...props} />
        </div>
    );
};

const TaskColumn = ({
    column,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onOpenTask,
}) => {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
    const tasks = column.tasks || [];

    return (
        <section
            ref={setNodeRef}
            className={`kanban-column ${isOver ? "column-over" : ""}`}
        >
            <div className="column-header">
                <div>
                    <h3>{column.name}</h3>
                    <span>{tasks.length} tasks</span>
                </div>
                <button type="button" onClick={() => onAddTask(column.id)}>
                    + Add
                </button>
            </div>

            <SortableContext
                items={tasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="column-tasks">
                    {tasks.map((task) => (
                        <SortableTask
                            key={task.id}
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            onOpen={(selectedTask) =>
                                onOpenTask({
                                    ...selectedTask,
                                    column: { name: column.name },
                                })
                            }
                        />
                    ))}
                    {tasks.length === 0 && (
                        <p className="empty-column">Drop tasks here</p>
                    )}
                </div>
            </SortableContext>
        </section>
    );
};

export default TaskColumn;
