import api from "./axios.js";

export const getOrganizations = async () => {
    const response = await api.get("/organizations");
    return response.data.organizations || [];
};

export const createOrganization = async (name) => {
    const response = await api.post("/organizations", { name });
    return response.data.organization;
};

export const updateOrganization = async (organizationId, name) => {
    const response = await api.put(`/organizations/${organizationId}`, { name });
    return response.data.organization;
};

export const deleteOrganization = async (organizationId) => {
    const response = await api.delete(`/organizations/${organizationId}`);
    return response.data;
};

export const createTenant = async (data) => {
    const response = await api.post("/tenants", data);
    return response.data.tenant;
};

export const updateTenant = async (tenantId, name) => {
    const response = await api.patch(`/tenants/${tenantId}`, { name });
    return response.data.tenant;
};

export const deleteTenant = async (tenantId) => {
    const response = await api.delete(`/tenants/${tenantId}`);
    return response.data;
};

export const getTenants = async (organizationId) => {
    const response = await api.get(
        `/tenants/organization/${organizationId}`
    );

    return response.data.tenants || [];
};

export const getTenantMembers = async (tenantId) => {
    const response = await api.get(`/tenants/${tenantId}/members`);
    return response.data.members || [];
};

export const addTenantMember = async (tenantId, data) => {
    const response = await api.post(`/tenants/${tenantId}/members`, data);
    return response.data.membership;
};

export const updateTenantMember = async (tenantId, membershipId, role) => {
    const response = await api.patch(
        `/tenants/${tenantId}/members/${membershipId}`,
        { role }
    );
    return response.data.membership;
};

export const removeTenantMember = async (tenantId, membershipId) => {
    const response = await api.delete(
        `/tenants/${tenantId}/members/${membershipId}`
    );
    return response.data;
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

export const updateBoard = async (tenantId, boardId, data) => {
    const response = await api.put(`/boards/${tenantId}/${boardId}`, data);
    return response.data.board;
};

export const deleteBoard = async (tenantId, boardId) => {
    const response = await api.delete(`/boards/${tenantId}/${boardId}`);
    return response.data;
};
