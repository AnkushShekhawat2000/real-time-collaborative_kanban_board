import api from "./axios.js";

export const getBoardDetails = async (tenantId, boardId) => {
    const response = await api.get(`/boards/${tenantId}/${boardId}`);
    return response.data.board;
};

export const getColumns = async (tenantId, boardId) => {
    const response = await api.get(`/columns/${tenantId}/${boardId}`);
    return response.data.columns || [];
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
}) => {
    const response = await api.delete(
        `/tasks/${tenantId}/${boardId}/${columnId}/${taskId}`
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
