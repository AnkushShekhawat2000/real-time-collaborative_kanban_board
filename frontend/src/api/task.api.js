import api from "./axios.js";

export const getBoardDetails = async (tenantId, boardId) => {
    const response = await api.get(`/boards/${tenantId}/${boardId}`);
    return response.data.board;
};

export const getColumns = async (tenantId, boardId) => {
    const response = await api.get(`/columns/${tenantId}/${boardId}`);
    return response.data.columns || [];
};

export const createColumn = async (tenantId, boardId, name) => {
    const response = await api.post("/columns", {
        tenantId,
        boardId,
        name,
    });
    return response.data.column;
};

export const updateColumn = async ({
    tenantId,
    boardId,
    columnId,
}, name) => {
    const response = await api.put(
        `/columns/${tenantId}/${boardId}/${columnId}`,
        { name }
    );
    return response.data.column;
};

export const deleteColumn = async ({
    tenantId,
    boardId,
    columnId,
}) => {
    const response = await api.delete(
        `/columns/${tenantId}/${boardId}/${columnId}`
    );
    return response.data;
};

export const createTask = async (data) => {
    const response = await api.post("/tasks", data);
    return response.data.task;
};

export const updateTask = async ({
    tenantId,
    boardId,
    columnId,
    taskId,
}, data) => {
    const response = await api.patch(
        `/tasks/${tenantId}/${boardId}/${columnId}/${taskId}`,
        data
    );

    return response.data.task;
};

export const deleteTask = async ({
    tenantId,
    boardId,
    columnId,
    taskId,
}, expectedVersion) => {
    const response = await api.delete(
        `/tasks/${tenantId}/${boardId}/${columnId}/${taskId}`,
        { data: { expectedVersion } }
    );

    return response.data;
};

export const moveTask = async ({
    tenantId,
    boardId,
    sourceColumnId,
    taskId,
}, data) => {
    const response = await api.patch(
        `/tasks/${tenantId}/${boardId}/${sourceColumnId}/${taskId}/move`,
        data
    );

    return response.data.task;
};

export const assignTask = async ({
    tenantId,
    boardId,
    columnId,
    taskId,
}, assigneeId) => {
    const response = await api.patch(
        `/tasks/${tenantId}/${boardId}/${columnId}/${taskId}/assign`,
        { assigneeId }
    );

    return response.data.task;
};

export const unassignTask = async ({
    tenantId,
    boardId,
    columnId,
    taskId,
}) => {
    const response = await api.patch(
        `/tasks/${tenantId}/${boardId}/${columnId}/${taskId}/unassign`
    );

    return response.data.task;
};
