# Socket.IO Events

Socket.IO connects to `http://localhost:5000` by default. Configure
`VITE_SOCKET_URL` in the frontend environment when using another URL.

## Authentication and tenant rooms

The client sends its JWT in the Socket.IO handshake:

```js
io(SOCKET_URL, { auth: { token } });
```

The server verifies the token and looks up the user before accepting the
connection. To join a tenant, emit the tenant ID as a string:

```js
socket.emit("tenant:join", tenantId, (result) => {
    // result.success indicates whether authorization passed
});
```

The server permits a tenant-scoped `TENANT_ADMIN`/`MEMBER` membership or an
organization-level `ORG_ADMIN` membership for the tenant's organization.
Joining a different tenant leaves the previous tenant room. Clients can emit
`tenant:leave` with the tenant ID to leave explicitly.

## Server-to-client events

| Event | Payload | Meaning |
|---|---|---|
| `presence:updated` | `[{ "id": "user-id", "name": "Asha" }]` | Full online-user snapshot for the joined tenant |
| `task:created` | Task fields plus `tenantId`, `boardId`, `actorId` | A task was created |
| `task:updated` | Task fields plus `tenantId`, `boardId`, `actorId` | A task was updated |
| `task:moved` | Task fields plus `sourceColumnId`, `destinationColumnId`, and context IDs | A task moved or reordered |
| `task:deleted` | `id`, `columnId`, `tenantId`, `boardId`, `actorId` | A task was deleted |
| `task:assigned` | Task fields plus context IDs | A task was assigned or unassigned |
| `task:reordered` | `tenantId`, `boardId`, `columnId`, `taskIds`, `actorId` | Tasks in a column were reordered |
| `board:created` | `tenantId`, `boardId`, `name`, `actorId` | A board was created |
| `board:updated` | `tenantId`, `boardId`, `name`, `actorId` | A board was renamed |
| `board:deleted` | `tenantId`, `boardId`, `actorId` | A board was deleted |
| `column:created` | `tenantId`, `boardId`, `columnId`, `actorId` | A column was created |
| `column:updated` | `tenantId`, `boardId`, `columnId`, `name`, `actorId` | A column was renamed |
| `column:deleted` | `tenantId`, `boardId`, `columnId`, `actorId` | A column was deleted |
| `column:reordered` | `tenantId`, `boardId`, `columnIds`, `actorId` | Columns were reordered |
| `tenant:access-revoked` | `tenantId` | The connected user was removed from the tenant and must reload workspace access |
| `tenant:deleted` | `tenantId` | The tenant was deleted; clients clear their active tenant selection |

Task events are broadcast to the authorized tenant room. `boardId` is included
so clients can ignore events for other boards in the same tenant. The current
client reloads the board after relevant task/column events and after
reconnecting. Board-list clients reload after board events.

## Operational note

Presence is stored in process memory. A single server instance is supported;
multi-instance deployments need a shared Socket.IO adapter and distributed
presence tracking.
