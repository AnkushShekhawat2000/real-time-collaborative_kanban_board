const tenantRoles = ["MEMBER", "TENANT_ADMIN"];

export const getTenantMembershipPolicyError = ({
    actorRole,
    targetRole,
    requestedRole,
}) => {
    if (
        requestedRole !== undefined &&
        !tenantRoles.includes(requestedRole)
    ) {
        return "INVALID_ROLE";
    }

    if (
        actorRole !== "ORG_ADMIN" &&
        requestedRole !== undefined &&
        requestedRole !== "MEMBER"
    ) {
        return "FORBIDDEN";
    }

    if (
        actorRole !== "ORG_ADMIN" &&
        targetRole !== undefined &&
        targetRole !== "MEMBER"
    ) {
        return "FORBIDDEN";
    }

    return null;
};
