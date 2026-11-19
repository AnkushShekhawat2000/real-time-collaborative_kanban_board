import api from "./axios.js";

export const getTenantActivities = async (tenantId, page = 1) => {
    const response = await api.get(
        `/activities/${tenantId}?page=${page}&limit=10`
    );

    return response.data;
};
