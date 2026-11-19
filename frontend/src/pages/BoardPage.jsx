import {
    useCallback,
    useEffect,
    useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
    assignTask,
    createColumn,
    deleteColumn,
    updateColumn,
    unassignTask,
    updateTask,
} from "../api/task.api.js";
import { deleteBoard, updateBoard } from "../api/workspace.api.js";
import { getTenantMembers } from "../api/workspace.api.js";
import { useAuth } from "../context/useAuth.js";
import { useWorkspace } from "../context/useWorkspace.js";
import { useRealtime } from "../context/useRealtime.js";
import TaskColumn from "../components/kanban/TaskColumn.jsx";
import TaskDetail from "../components/kanban/TaskDetail.jsx";
import TaskModal from "../components/kanban/TaskModal.jsx";
import NameDialog from "../components/common/NameDialog.jsx";

const BoardPage = () => {
    const { boardId } = useParams();
    const navigate = useNavigate();
    const { selectedTenant } = useWorkspace();
    const { connected, onlineUsers, socket } = useRealtime();
    const { user } = useAuth();
    const [board, setBoard] = useState(null);
    const [columns, setColumns] = useState([]);
    const [tenantMembers, setTenantMembers] = useState([]);
    const [moveHistory, setMoveHistory] = useState({
        key: null,
        undo: [],
        redo: [],
    });
    const [loadedKey, setLoadedKey] = useState(null);
    const [boardKey, setBoardKey] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [nameDialog, setNameDialog] = useState(null);
    const [nameDialogError, setNameDialogError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [targetColumnId, setTargetColumnId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const requestKey = selectedTenant
        ? `${selectedTenant.id}:${boardId}`
        : null;
    const undoStack = moveHistory.key === requestKey ? moveHistory.undo : [];
    const redoStack = moveHistory.key === requestKey ? moveHistory.redo : [];
    const updateMoveHistory = useCallback((update) => {
        setMoveHistory((current) => {
            const currentHistory = current.key === requestKey
                ? current
                : { key: requestKey, undo: [], redo: [] };
            return {
                key: requestKey,
                ...update(currentHistory),
            };
        });
    }, [requestKey]);
    const clearMoveHistory = useCallback(() => {
        setMoveHistory({ key: requestKey, undo: [], redo: [] });
    }, [requestKey]);
    const canManageBoard = user?.memberships?.some(
        (membership) =>
            (
                membership.tenantId === selectedTenant?.id &&
                membership.role === "TENANT_ADMIN"
            ) ||
            (
                membership.organizationId ===
                    selectedTenant?.organizationId &&
                membership.tenantId === null &&
                membership.role === "ORG_ADMIN"
            )
    );
    const loading = Boolean(requestKey && requestKey !== loadedKey) || refreshing;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
            disabled: saving,
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
            setSelectedTask((current) => {
                if (!current) {
                    return current;
                }

                const latestColumn = columnData.find((column) =>
                    column.tasks?.some((task) => task.id === current.id)
                );
                const latestTask = latestColumn?.tasks.find(
                    (task) => task.id === current.id
                );

                return latestTask
                    ? { ...latestTask, column: { name: latestColumn.name } }
                    : null;
            });
            setBoardKey(requestKey);
            setLoadedKey(requestKey);
            return true;
        } catch (requestError) {
            setBoard(null);
            setColumns([]);
            setBoardKey(null);
            setLoadedKey(requestKey);
            setError(
                requestError.response?.data?.message ||
                "Failed to load board"
            );
            return false;
        } finally {
            setRefreshing(false);
        }
    }, [boardId, requestKey, selectedTenant]);

    useEffect(() => {
        if (!selectedTenant) {
            return undefined;
        }

        let active = true;

        getTenantMembers(selectedTenant.id)
            .then((members) => {
                if (active) {
                    setTenantMembers(members);
                }
            })
            .catch((requestError) => {
                if (active) {
                    setError(
                        requestError.response?.data?.message ||
                        "Failed to load branch members"
                    );
                }
            });

        return () => {
            active = false;
        };
    }, [selectedTenant]);

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
                    setBoard(null);
                    setColumns([]);
                    setBoardKey(null);
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

    useEffect(() => {
        if (!socket) {
            return undefined;
        }

        const handleTaskChange = (event) => {
            if (
                event.tenantId !== selectedTenant?.id ||
                event.boardId !== boardId
            ) {
                return;
            }

            if (event.actorId !== user?.id) {
                clearMoveHistory();
            }

            void loadBoard();
        };

        const handleReconnect = () => {
            clearMoveHistory();
            void loadBoard();
        };
        const handleBoardStructureChange = (event) => {
            if (
                event.tenantId !== selectedTenant?.id ||
                event.boardId !== boardId
            ) {
                return;
            }

            if (event.actorId !== user?.id) {
                clearMoveHistory();
            }
            void loadBoard();
        };

        socket.on("task:created", handleTaskChange);
        socket.on("task:updated", handleTaskChange);
        socket.on("task:moved", handleTaskChange);
        socket.on("task:deleted", handleTaskChange);
        socket.on("task:assigned", handleTaskChange);
        socket.on("task:reordered", handleTaskChange);
        socket.on("connect", handleReconnect);
        socket.on("board:updated", handleBoardStructureChange);
        socket.on("board:deleted", handleBoardStructureChange);
        socket.on("column:created", handleBoardStructureChange);
        socket.on("column:updated", handleBoardStructureChange);
        socket.on("column:deleted", handleBoardStructureChange);
        socket.on("column:reordered", handleBoardStructureChange);

        return () => {
            socket.off("task:created", handleTaskChange);
            socket.off("task:updated", handleTaskChange);
            socket.off("task:moved", handleTaskChange);
            socket.off("task:deleted", handleTaskChange);
            socket.off("task:assigned", handleTaskChange);
            socket.off("task:reordered", handleTaskChange);
            socket.off("connect", handleReconnect);
            socket.off("board:updated", handleBoardStructureChange);
            socket.off("board:deleted", handleBoardStructureChange);
            socket.off("column:created", handleBoardStructureChange);
            socket.off("column:updated", handleBoardStructureChange);
            socket.off("column:deleted", handleBoardStructureChange);
            socket.off("column:reordered", handleBoardStructureChange);
        };
    }, [
        boardId,
        clearMoveHistory,
        loadBoard,
        selectedTenant?.id,
        socket,
        user?.id,
    ]);

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

            clearMoveHistory();
            setModalOpen(false);
            setEditingTask(null);
            await loadBoard();
        } catch (requestError) {
            if (
                requestError.response?.status === 409 ||
                requestError.response?.data?.code === "VERSION_CONFLICT"
            ) {
                clearMoveHistory();
                setModalOpen(false);
                setEditingTask(null);
                const refreshed = await loadBoard();
                setError(
                    refreshed
                        ? "Task changed by another user. Latest data is loaded; reopen the task to review and edit."
                        : "Task changed by another user, but the latest board could not be loaded."
                );
                return;
            }

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

        setSaving(true);
        setError("");

        try {
            await deleteTask({
                tenantId: selectedTenant.id,
                boardId,
                columnId: task.columnId,
                taskId: task.id,
            }, task.version);

            if (selectedTask?.id === task.id) {
                setSelectedTask(null);
            }

            clearMoveHistory();
            await loadBoard();
        } catch (requestError) {
            if (requestError.response?.status === 409) {
                clearMoveHistory();
                await loadBoard();
            }
            setError(
                requestError.response?.data?.message ||
                "Unable to delete task"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleRenameBoard = () => {
        setNameDialog({ action: "rename-board", initialName: board.name });
        setNameDialogError("");
    };

    const handleDeleteBoard = async () => {
        if (!window.confirm(
            "Delete this board and all its columns and tasks?"
        )) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            await deleteBoard(selectedTenant.id, boardId);
            navigate("/dashboard");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to delete board"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCreateColumn = () => {
        setNameDialog({ action: "create-column", initialName: "" });
        setNameDialogError("");
    };

    const handleRenameColumn = (column) => {
        setNameDialog({
            action: "rename-column",
            columnId: column.id,
            initialName: column.name,
        });
        setNameDialogError("");
    };

    const handleSaveName = async (name) => {
        if (!nameDialog) {
            return;
        }

        setSaving(true);
        setNameDialogError("");
        setError("");

        try {
            if (nameDialog.action === "rename-board") {
                setBoard(await updateBoard(
                    selectedTenant.id,
                    boardId,
                    { name }
                ));
            } else if (nameDialog.action === "create-column") {
                await createColumn(selectedTenant.id, boardId, name);
                await loadBoard();
            } else if (nameDialog.action === "rename-column") {
                await updateColumn(
                    {
                        tenantId: selectedTenant.id,
                        boardId,
                        columnId: nameDialog.columnId,
                    },
                    name
                );
                await loadBoard();
            }

            setNameDialog(null);
        } catch (requestError) {
            const message = requestError.response?.data?.message ||
                "Unable to save name";
            setNameDialogError(message);
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteColumn = async (column) => {
        if (!window.confirm(
            `Delete "${column.name}" and all tasks inside it?`
        )) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            await deleteColumn({
                tenantId: selectedTenant.id,
                boardId,
                columnId: column.id,
            });
            setSelectedTask((current) => (
                current?.columnId === column.id ? null : current
            ));
            await loadBoard();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to delete column"
            );
        } finally {
            setSaving(false);
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
        setSaving(true);

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

            updateMoveHistory((history) => ({
                undo: [
                    ...history.undo,
                    {
                    taskId: task.id,
                    fromColumnId: sourceColumn.id,
                    fromPosition: sourcePosition,
                    toColumnId: destinationColumn.id,
                    toPosition: destinationPosition,
                    },
                ].slice(-20),
                redo: [],
            }));
            await loadBoard();
        } catch (requestError) {
            setColumns(previousColumns);
            clearMoveHistory();
            await loadBoard();
            setError(
                requestError.response?.status === 409
                    ? "Task changed by another user. Board refreshed."
                    : requestError.response?.data?.message ||
                        "Task movement failed"
            );
        } finally {
            setSaving(false);
        }
    };

    const applyMoveHistory = async (direction) => {
        const undoing = direction === "undo";
        const sourceStack = undoing ? undoStack : redoStack;
        const entry = sourceStack[sourceStack.length - 1];

        if (!entry || !selectedTenant) {
            return;
        }

        const task = columns
            .flatMap((column) => column.tasks)
            .find((item) => item.id === entry.taskId);

        if (!task) {
            clearMoveHistory();
            setError("Task is no longer on this board; move history was cleared.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const movedTask = await moveTask(
                {
                    tenantId: selectedTenant.id,
                    boardId,
                    sourceColumnId: task.columnId,
                    taskId: task.id,
                },
                {
                    destinationColumnId: undoing
                        ? entry.fromColumnId
                        : entry.toColumnId,
                    destinationPosition: undoing
                        ? entry.fromPosition
                        : entry.toPosition,
                    expectedVersion: task.version,
                }
            );

            if (undoing) {
                updateMoveHistory((history) => ({
                    undo: history.undo.slice(0, -1),
                    redo: [...history.redo, entry].slice(-20),
                }));
            } else {
                updateMoveHistory((history) => ({
                    undo: [...history.undo, entry].slice(-20),
                    redo: history.redo.slice(0, -1),
                }));
            }

            if (!movedTask) {
                throw new Error("Move history request returned no task");
            }
            await loadBoard();
        } catch (requestError) {
            clearMoveHistory();
            await loadBoard();
            setError(
                requestError.response?.status === 409
                    ? "The task changed on the server. Board refreshed and move history cleared."
                    : requestError.response?.data?.message ||
                        requestError.message ||
                        "Unable to apply move history"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleAssignTask = async (assigneeId) => {
        if (!selectedTask) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            const taskInput = {
                tenantId: selectedTenant.id,
                boardId,
                columnId: selectedTask.columnId,
                taskId: selectedTask.id,
            };
            const updatedTask = assigneeId
                ? await assignTask(taskInput, assigneeId)
                : await unassignTask(taskInput);

            setSelectedTask((current) => current && ({
                ...updatedTask,
                column: current.column,
            }));
            await loadBoard();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to update task assignee"
            );
        } finally {
            setSaving(false);
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
                <button
                    type="button"
                    onClick={() => void loadBoard()}
                    disabled={refreshing}
                >
                    {refreshing ? "Retrying..." : "Retry"}
                </button>
                <Link to="/dashboard">Back to workspace</Link>
            </main>
        );
    }

    return (
        <main className="board-page">
            <header className="board-page-header">
                <div className="board-heading">
                    <Link to="/dashboard">Back to workspace</Link>
                    <h1>{board?.name || "Kanban Board"}</h1>
                    <p>
                        {connected
                            ? `${onlineUsers.length} team members online`
                            : "Reconnecting to real-time updates..."}
                    </p>
                    {connected && onlineUsers.length > 0 && (
                        <div className="presence-list" aria-label="Online members">
                            {onlineUsers.map((onlineUser) => (
                                <span key={onlineUser.id}>
                                    {onlineUser.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="board-header-actions">
                    <div className="history-actions">
                        <button
                            type="button"
                            onClick={() => void applyMoveHistory("undo")}
                            disabled={saving || undoStack.length === 0}
                        >
                            Undo
                        </button>
                        <button
                            type="button"
                            onClick={() => void applyMoveHistory("redo")}
                            disabled={saving || redoStack.length === 0}
                        >
                            Redo
                        </button>
                    </div>
                    <button
                        type="button"
                        className="primary-action"
                        onClick={() => handleAddTask(columns[0]?.id)}
                        disabled={!columns.length}
                    >
                        + Create Task
                    </button>
                    {canManageBoard && (
                        <div className="board-management-actions">
                            <button
                                type="button"
                                onClick={handleCreateColumn}
                                disabled={saving}
                            >
                                + Add Column
                            </button>
                            <button
                                type="button"
                                onClick={handleRenameBoard}
                                disabled={saving}
                            >
                                Rename Board
                            </button>
                            <button
                                type="button"
                                className="danger-button"
                                onClick={handleDeleteBoard}
                                disabled={saving}
                            >
                                Delete Board
                            </button>
                        </div>
                    )}
                </div>
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
                            canManageBoard={canManageBoard}
                            onAddTask={handleAddTask}
                            onRenameColumn={handleRenameColumn}
                            onDeleteColumn={handleDeleteColumn}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            onOpenTask={setSelectedTask}
                        />
                    ))}
                    {columns.length === 0 && (
                        <div className="board-empty-state">
                            <h2>This board has no columns yet</h2>
                            <p>Add a column to start organizing tasks.</p>
                            {canManageBoard && (
                                <button
                                    type="button"
                                    onClick={handleCreateColumn}
                                >
                                    Add your first column
                                </button>
                            )}
                        </div>
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
                members={tenantMembers}
                assigning={saving}
                error={error}
                onAssign={handleAssignTask}
                onClose={() => setSelectedTask(null)}
            />
            {nameDialog && (
                <NameDialog
                    title={
                        nameDialog.action === "rename-board"
                            ? "Rename board"
                            : nameDialog.action === "rename-column"
                                ? "Rename column"
                                : "Add a column"
                    }
                    label={
                        nameDialog.action === "rename-board"
                            ? "Board name"
                            : "Column name"
                    }
                    initialName={nameDialog.initialName}
                    loading={saving}
                    error={nameDialogError}
                    onClose={() => setNameDialog(null)}
                    onSubmit={handleSaveName}
                />
            )}
        </main>
    );
};

export default BoardPage;
