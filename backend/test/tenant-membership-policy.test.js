import assert from "node:assert/strict";
import test from "node:test";

import { getTenantMembershipPolicyError } from "../src/services/tenantMembershipPolicy.js";

test("tenant admins can add regular members but cannot grant admin roles", () => {
    assert.equal(
        getTenantMembershipPolicyError({
            actorRole: "TENANT_ADMIN",
            requestedRole: "MEMBER",
        }),
        null
    );
    assert.equal(
        getTenantMembershipPolicyError({
            actorRole: "TENANT_ADMIN",
            requestedRole: "TENANT_ADMIN",
        }),
        "FORBIDDEN"
    );
});

test("tenant admins cannot manage another tenant admin", () => {
    assert.equal(
        getTenantMembershipPolicyError({
            actorRole: "TENANT_ADMIN",
            targetRole: "TENANT_ADMIN",
        }),
        "FORBIDDEN"
    );
});

test("organization admins can grant tenant admin but no tenant role can grant org admin", () => {
    assert.equal(
        getTenantMembershipPolicyError({
            actorRole: "ORG_ADMIN",
            requestedRole: "TENANT_ADMIN",
        }),
        null
    );
    assert.equal(
        getTenantMembershipPolicyError({
            actorRole: "ORG_ADMIN",
            requestedRole: "ORG_ADMIN",
        }),
        "INVALID_ROLE"
    );
});
