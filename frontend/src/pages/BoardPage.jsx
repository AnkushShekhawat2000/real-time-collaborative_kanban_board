import {
    useCallback,
    useEffect,
    useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
    closestCorners,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import {
    createTask,
    deleteTask,
    getBoardDetails,
    getColumns,
    moveTask,
    updateTask,
} from "../api/task.api.js";
import { useWorkspace } from "../context/useWorkspace.js";
import TaskColumn from "../components/kanban/TaskColumn.jsx";
import TaskDetail from "../components/kanban/TaskDetail.jsx";
import TaskModal from "../components/kanban/TaskModal.jsx";

const BoardPage = () => {
    const { boardId } = useParams();
    const { selectedTenant } = useWorkspace();
    const [board, setBoard] = useState(null);
    const [columns, setColumns] = useState([]);
    const [loadedKey, setLoadedKey] = useState(null);
    const [boardKey, setBoardKey] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [targetColumnId, setTargetColumnId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const requestKey = selectedTenant
        ? `${selectedTenant.id}:${boardId}`
        : null;
    const loading = Boolean(requestKey && requestKey !== loadedKey) || refreshing;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const loadBoard = useCallback(async () => {
        if (!selectedTenant) {
            return;
        }

        setRefreshing(true);
        setError("");

        try {
            const [boardData, columnData] = await Promise.all([
                getBoardDetails(selectedTenant.id, boardId),
                getColumns(selectedTenant.id, boardId),
            ]);

            setBoard(boardData);
            setColumns(
                columnData.map((column) => ({
                    ...column,
                    tasks: column.tasks || [],
                }))
            );
            setBoardKey(requestKey);
            setLoadedKey(requestKey);
        } catch (requestError) {
            setLoadedKey(requestKey);
            setError(
                requestError.response?.data?.message ||
                "Failed to load board"
            );
        } finally {
            setRefreshing(false);
        }
    }, [boardId, requestKey, selectedTenant]);

    useEffect(() => {
        if (!selectedTenant) {
            return undefined;
        }

        let active = true;

        const fetchBoard = async () => {
            try {
                const [boardData, columnData] = await Promise.all([
                    getBoardDetails(selectedTenant.id, boardId),
                    getColumns(selectedTenant.id, boardId),
                ]);

                if (!active) {
                    return;
                }

                setBoard(boardData);
                setColumns(
                    columnData.map((column) => ({
                        ...column,
                        tasks: column.tasks || [],
                    }))
                );
                setBoardKey(requestKey);
                setError("");
            } catch (requestError) {
                if (active) {
                    setError(
                        requestError.response?.data?.message ||
                        "Failed to load board"
                    );
                }
            } finally {
                if (active) {
                    setLoadedKey(requestKey);
                }
            }
        };

        fetchBoard();

        return () => {
            active = false;
        };
    }, [boardId, requestKey, selectedTenant]);

    const handleAddTask = (columnId) => {
        setEditingTask(null);
        setTargetColumnId(columnId);
        setError("");
        setModalOpen(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setTargetColumnId(task.columnId);
        setError("");
        setModalOpen(true);
    };

    const handleSaveTask = async (data) => {
        setSaving(true);
        setError("");

        try {
            if (editingTask) {
                await updateTask(
                    {
                        tenantId: selectedTenant.id,
                        boardId,
                        columnId: editingTask.columnId,
                        taskId: editingTask.id,
                    },
                    {
                        ...data,
                        expectedVersion: editingTask.version,
                    }
                );
            } else {
                await createTask({
                    ...data,
                    tenantId: selectedTenant.id,
                    boardId,
                    columnId: targetColumnId,
                });
            }

            setModalOpen(false);
            setEditingTask(null);
            await loadBoard();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to save task"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTask = async (task) => {
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        setError("");

        try {
            await deleteTask({
                tenantId: selectedTenant.id,
                boardId,
                columnId: task.columnId,
                taskId: task.id,
            });

            if (selectedTask?.id === task.id) {
                setSelectedTask(null);
            }

            await loadBoard();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to delete task"
            );
        }
    };

    const handleDragEnd = async ({ active, over }) => {
        if (!over || active.id === over.id) {
            return;
        }

        const sourceColumn = columns.find((column) =>
            column.tasks.some((task) => task.id === active.id)
        );
        const destinationColumn = columns.find((column) =>
            column.id === over.id ||
            column.tasks.some((task) => task.id === over.id)
        );

        if (!sourceColumn || !destinationColumn) {
            return;
        }

        const task = sourceColumn.tasks.find((item) => item.id === active.id);
        const destinationTasks = destinationColumn.tasks.filter(
            (item) => item.id !== task.id
        );
        const overTaskIndex = destinationTasks.findIndex(
            (item) => item.id === over.id
        );
        const destinationPosition = overTaskIndex === -1
            ? destinationTasks.length
            : overTaskIndex;
        const sourcePosition = sourceColumn.tasks.findIndex(
            (item) => item.id === task.id
        );

        if (
            sourceColumn.id === destinationColumn.id &&
            sourcePosition === destinationPosition
        ) {
            return;
        }

        const previousColumns = columns;
        const nextColumns = columns.map((column) => {
            let tasks = column.tasks;

            if (
                column.id === sourceColumn.id ||
                column.id === destinationColumn.id
            ) {
                tasks = tasks.filter((item) => item.id !== task.id);
            }

            if (column.id === destinationColumn.id) {
                tasks = [...tasks];
                tasks.splice(destinationPosition, 0, {
                    ...task,
                    columnId: destinationColumn.id,
                });
            }

            return {
                ...column,
                tasks: tasks.map((item, index) => ({
                    ...item,
                    position: index,
                })),
            };
        });

        setColumns(nextColumns);
        setError("");

        try {
            await moveTask(
                {
                    tenantId: selectedTenant.id,
                    boardId,
                    sourceColumnId: sourceColumn.id,
                    taskId: task.id,
                },
                {
                    destinationColumnId: destinationColumn.id,
                    destinationPosition,
                    expectedVersion: task.version,
                }
            );

            await loadBoard();
        } catch (requestError) {
            setColumns(previousColumns);
            await loadBoard();
            setError(
                requestError.response?.status === 409
                    ? "Task changed by another user. Board refreshed."
                    : requestError.response?.data?.message ||
                        "Task movement failed"
            );
        }
    };

    if (!selectedTenant) {
        return (
            <main className="board-page">
                <p>Select a branch before opening a board.</p>
                <Link to="/dashboard">Back to workspace</Link>
            </main>
        );
    }

    if (loading) {
        return <p className="loading-message">Loading board...</p>;
    }

    if (error && boardKey !== requestKey) {
        return (
            <main className="board-page">
                <p className="error-message">{error}</p>
                <Link to="/dashboard">Back to workspace</Link>
            </main>
        );
    }

    return (
        <main className="board-page">
            <header className="board-page-header">
                <div>
                    <Link to="/dashboard">Back to workspace</Link>
                    <h1>{board?.name || "Kanban Board"}</h1>
                    <p>Manage your team&apos;s tasks</p>
                </div>
                <button
                    type="button"
                    onClick={() => handleAddTask(columns[0]?.id)}
                    disabled={!columns.length}
                >
                    + Create Task
                </button>
            </header>

            {error && <p className="error-message">{error}</p>}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                <div className="kanban-board">
                    {columns.map((column) => (
                        <TaskColumn
                            key={column.id}
                            column={column}
                            onAddTask={handleAddTask}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            onOpenTask={setSelectedTask}
                        />
                    ))}
                    {columns.length === 0 && (
                        <p>This board has no columns yet.</p>
                    )}
                </div>
            </DndContext>

            {modalOpen && (
                <TaskModal
                    key={editingTask?.id || `new-${targetColumnId}`}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleSaveTask}
                    initialTask={editingTask}
                    loading={saving}
                    error={error}
                />
            )}

            <TaskDetail
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </main>
    );
};

export default BoardPage;
