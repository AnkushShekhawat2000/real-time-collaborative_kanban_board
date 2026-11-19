# Security Notes and Verification

## Tenant isolation

- REST tenant access is checked against the authenticated user's memberships.
- Organization-level `ORG_ADMIN` membership grants access to that
  organization's tenants; tenant admins and members are limited to their
  assigned tenant.
- Board lookups are scoped by the authorized tenant.
- Column lookups are scoped by the verified board.
- Task operations use the verified column and board hierarchy; `Task` does not
  contain a direct `tenantId`.
- Tenant listing returns all organization tenants only to organization admins;
  other members receive only their assigned tenants.
- Socket connections authenticate JWTs and tenant-room joins verify the same
  membership roles before joining.
- Removing a tenant membership evicts the user's sockets from that tenant room
  and tells the client to clear the active tenant selection.

## Role permissions

| Role | Tenant access | Board/column administration | Task operations |
|---|---|---|---|
| `ORG_ADMIN` | All tenants in own organization | Yes | Yes |
| `TENANT_ADMIN` | Assigned tenant | Manage members and board/columns | Yes |
| `MEMBER` | Assigned tenant | No | Yes |

Creating an organization assigns the authenticated creator an organization-
level `ORG_ADMIN` membership. Only that organization-level admin can rename or delete the organization.
Organization admins can create/delete tenants and assign `TENANT_ADMIN` or
`MEMBER` roles. Tenant admins can rename their branch and add/remove regular
members, but cannot grant admin roles or remove another tenant admin. Tenant
member APIs derive the organization ID from the authorized tenant rather than
accepting it from the caller.

## Validation and concurrency

- Task create/update payloads are validated with Zod.
- Task updates require `expectedVersion`; stale writes return HTTP `409`
  (`VERSION_CONFLICT`) and do not emit a successful update event.
- Task and column reorder operations verify the submitted IDs exactly match
  the target collection.
- Task position is unique per column. Create, move, and reorder operations
  run transactionally; stale edits/deletes and serialization conflicts return
  `409` rather than silently losing updates.
- Task create, edit, move, delete, assignment, and unassignment activity rows
  are written in the same transaction as their task change.
- Tenant and board identifiers from a request are checked by authorization
  middleware before business operations.

## Verification checklist

1. A member can list only tenants for which they have membership.
2. A member cannot read a board or task in a tenant they do not belong to.
3. A tenant admin can administer boards/columns only in their assigned tenant.
4. A member cannot create, rename, reorder, or delete boards/columns.
5. A socket join for a tenant without membership returns `success: false`.
6. Invalid task titles, priorities, dates, and versions return HTTP `400`.
7. Updating a task with an outdated version returns HTTP `409`.
8. A board client ignores task events for another board or tenant.
9. A tenant admin cannot grant `TENANT_ADMIN` or manage another branch.
10. A tenant admin cannot demote/remove the last tenant admin.
11. A member can see the branch activity feed but cannot change member roles.
12. A request using a board, column, or membership ID from another tenant
    returns not found or forbidden and exposes no foreign data.

The automated backend test suite currently covers task payload validation.
Tenant isolation and role checks should also be exercised against a seeded
PostgreSQL database before deployment.

## Limitations

- JWT logout is client-side token removal; issued tokens remain valid until
  expiration because there is no token revocation store.
- Socket presence is in-memory and requires shared infrastructure for
  multi-instance deployments.
- Authentication endpoints do not currently implement rate limiting.
- Tenant membership is granted to an existing account by email; invitation
  delivery and organization-wide user discovery are not implemented.
