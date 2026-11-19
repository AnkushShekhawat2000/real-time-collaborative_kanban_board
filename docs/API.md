# HTTP API

Base URL: `http://localhost:5000/api`

All endpoints except registration, login, and health checks require:

```http
Authorization: Bearer <JWT>
```

Request and response bodies use JSON. IDs in URLs and request bodies must
belong to the authenticated user's authorized tenant hierarchy. The backend
derives the active tenant from membership checks; body IDs are not treated as
proof of access.

## Authentication

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a user |
| POST | `/auth/login` | Public | Authenticate and return a JWT |
| GET | `/auth/me` | Authenticated | Return the current user and memberships |
| POST | `/auth/logout` | Authenticated | Client should discard its JWT |

`POST /auth/register` body:

```json
{ "name": "Asha", "email": "asha@example.com", "password": "a-long-password" }
```

`POST /auth/login` uses `email` and `password`. Successful login/register
responses include `token` and `user`. Passwords must be 8–72 characters.
Logout is stateless: it does not revoke a JWT already issued.

## Organizations

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/organizations` | Authenticated | Create an organization and become its `ORG_ADMIN` |
| GET | `/organizations` | Authenticated | List organizations where the user has membership |
| PUT | `/organizations/:organizationId` | Organization admin | Rename an organization |
| DELETE | `/organizations/:organizationId` | Organization admin | Delete an organization and its dependent data |

Create and rename body:

```json
{ "name": "My Company" }
```

The create response includes the organization and `"role": "ORG_ADMIN"`.
Organization deletion cascades to tenants, boards, columns, tasks, memberships,
and activity logs; use it with care.

## Tenants

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/tenants` | Organization admin | Create a tenant |
| GET | `/tenants/organization/:organizationId` | Organization member | List accessible tenants |
| PATCH | `/tenants/:tenantId` | Organization or tenant admin | Rename a tenant |
| DELETE | `/tenants/:tenantId` | Organization admin | Delete a tenant and its data |
| GET | `/tenants/:tenantId/members` | Tenant member | List direct tenant memberships |
| POST | `/tenants/:tenantId/members` | Organization or tenant admin | Add an existing user by email |
| PATCH | `/tenants/:tenantId/members/:membershipId` | Organization or tenant admin | Change a tenant role |
| DELETE | `/tenants/:tenantId/members/:membershipId` | Organization or tenant admin | Remove a tenant member |

Create body:

```json
{ "organizationId": "org-id", "name": "Delhi Branch" }
```

An organization admin receives all tenants for their organization. Other
members receive only tenants to which they have a tenant-scoped membership.
Tenant admins can add/remove regular members. Only organization admins can
assign `TENANT_ADMIN`; organization-level `ORG_ADMIN` membership cannot be
assigned through the tenant member endpoints. A tenant must retain at least
one tenant admin. Member addition accepts an email for a user who has already
registered; no email invitation service is configured.

`PATCH /tenants/:tenantId` accepts `{ "name": "New Branch Name" }`.
`POST /tenants/:tenantId/members` accepts `{ "email": "user@example.com",
"role": "MEMBER" }`; organization admins may also specify `"TENANT_ADMIN"`.
Role changes accept `{ "role": "MEMBER" }` or `{ "role": "TENANT_ADMIN" }`.
Tenant deletion cascades to its memberships, boards, columns, tasks, and
activity logs.

## Boards

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/boards/:tenantId` | Tenant member | List boards and columns |
| POST | `/boards` | Organization or tenant admin | Create a board |
| GET | `/boards/:tenantId/:boardId` | Tenant member | Get board, columns, and tasks |
| PUT | `/boards/:tenantId/:boardId` | Organization or tenant admin | Update board |
| DELETE | `/boards/:tenantId/:boardId` | Organization or tenant admin | Delete board |

Create body includes `tenantId`, `name`, and optional `description`.
Each newly created board is initialized with `To Do`, `In Progress`, and
`Done` columns in the same transaction. Existing boards are not backfilled.
Update accepts `name` and/or `description`.

## Columns

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/columns/:tenantId/:boardId` | Tenant member | List columns and tasks |
| POST | `/columns` | Organization or tenant admin | Create a column |
| GET | `/columns/:tenantId/:boardId/:columnId` | Tenant member | Get a column and tasks |
| PUT | `/columns/:tenantId/:boardId/:columnId` | Organization or tenant admin | Rename a column |
| DELETE | `/columns/:tenantId/:boardId/:columnId` | Organization or tenant admin | Delete a column |
| PATCH | `/columns/:tenantId/:boardId/reorder` | Organization or tenant admin | Reorder columns |

Create body: `tenantId`, `boardId`, and `name`. Reorder body:

```json
{ "columnIds": ["column-id-1", "column-id-2"] }
```

The list must contain every column in that board exactly once.

## Tasks

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/tasks` | Tenant member | Create a task |
| GET | `/tasks/:tenantId/:boardId/:columnId` | Tenant member | List tasks in a column |
| GET | `/tasks/:tenantId/:boardId/:columnId/:taskId` | Tenant member | Get a task |
| PATCH | `/tasks/:tenantId/:boardId/:columnId/:taskId` | Tenant member | Update task with version check |
| DELETE | `/tasks/:tenantId/:boardId/:columnId/:taskId` | Tenant member | Delete a task with version check |
| PATCH | `/tasks/:tenantId/:boardId/:columnId/:taskId/move` | Tenant member | Move/reorder a task |
| PATCH | `/tasks/:tenantId/:boardId/:columnId/reorder` | Tenant member | Reorder all tasks in a column |
| PATCH | `/tasks/:tenantId/:boardId/:columnId/:taskId/assign` | Tenant member | Assign a tenant member |
| PATCH | `/tasks/:tenantId/:boardId/:columnId/:taskId/unassign` | Tenant member | Remove task assignee |

Create body:

```json
{
  "tenantId": "tenant-id",
  "boardId": "board-id",
  "columnId": "column-id",
  "title": "Prepare release",
  "description": "Complete release checklist",
  "priority": "HIGH",
  "dueDate": "2026-12-01"
}
```

`priority` can be `LOW`, `MEDIUM`, `HIGH`, or `URGENT`. `dueDate` can be a
valid ISO date/date-time string or `null`.

Update body requires the task's current `expectedVersion` and at least one
editable field:

```json
{
  "expectedVersion": 3,
  "title": "Prepare the release"
}
```

A stale version returns `409` with code `VERSION_CONFLICT`. Move body:

```json
{
  "destinationColumnId": "column-id",
  "destinationPosition": 0,
  "expectedVersion": 3
}
```

Reorder body is `{ "taskIds": ["task-id-1", "task-id-2"] }`; it must include
every task in the column exactly once. Assign body is
`{ "assigneeId": "user-id" }`.
Task deletion accepts `{ "expectedVersion": 3 }` in the JSON body and returns
`409 VERSION_CONFLICT` when the task changed since it was loaded.

## Activity logs

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/activities/:tenantId?page=1&limit=20` | Tenant member | Get paginated tenant activity |

Optional `boardId` filters activity to task entities currently in that board:
`/activities/:tenantId?boardId=:boardId&page=1&limit=20`.

## Health

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | API process health |
| GET | `/health/db` | Public | Database connectivity check |

## Common errors

Errors use `{ "success": false, "message": "..." }`. Common status codes are
`400` for invalid input, `401` for missing/invalid authentication, `403` for
unauthorized tenant/role access, `404` for missing resources, `409` for
version/concurrency conflicts, and `500` for unexpected server errors.
