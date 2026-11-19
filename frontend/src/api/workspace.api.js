import api from "./axios.js";

export const getOrganizations = (memberships = []) => {
    const organizations = memberships
        .map((membership) => membership.organization)
        .filter((organization) => organization?.id);

    return Array.from(
        new Map(organizations.map((organization) => [
            organization.id,
            organization,
        ])).values()
    );
};

export const getTenants = async (organizationId) => {
    const response = await api.get(
        `/tenants/organization/${organizationId}`
    );

    return response.data.tenants || [];
};

export const getBoards = async (tenantId) => {
    const response = await api.get(`/boards/${tenantId}`);
    return response.data.boards || [];
};

export const getBoard = async (tenantId, boardId) => {
    const response = await api.get(`/boards/${tenantId}/${boardId}`);
    return response.data.board;
};

export const createBoard = async (data) => {
    const response = await api.post("/boards", data);
    return response.data.board;
};
