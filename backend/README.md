# Backend setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL database.
2. From the `backend` directory, install dependencies, generate Prisma Client, validate the schema, and apply migrations:

   ```sh
   npm install
   npx prisma generate
   npx prisma validate
   npx prisma migrate dev
   ```

3. Create the initial organization, tenant, admin user, organization membership, and tenant-admin membership:

   ```sh
   npm run seed
   ```

   The seed hashes its development-only password with bcrypt. It uses `create`, so run it once against an empty database. Do not use the sample credentials in production.
4. Inspect the database with `npm run db:studio`.

The initial migration creates the eight Prisma models: Organization, Tenant, User, Membership, Board, Column, Task, and ActivityLog.
Prisma 7 uses the PostgreSQL driver adapter configured in `src/config/prisma.js`; the connection URL is loaded by `prisma.config.js` and `.env`.

## Tenant APIs

- `POST /api/tenants` creates a tenant. It requires a bearer token and an organization-level `ORG_ADMIN` membership (`tenantId: null`). The tenant slug is generated from its name.
- `GET /api/tenants/organization/:organizationId` lists tenants when the authenticated user has a membership in that organization.
- `verifyTenantAccess` and `allowRoles` are available for protecting tenant-scoped routes. Tenant admins and members are limited to tenants where they have a membership; organization admins are scoped to their organization.

## Board APIs

- `POST /api/boards` creates a board for the `tenantId` in the request body. Organization admins and tenant admins can create boards.
- `GET /api/boards/:tenantId` lists boards in an authorized tenant.
- `GET /api/boards/:tenantId/:boardId` returns a board with its ordered columns and tasks.
- `PUT /api/boards/:tenantId/:boardId` updates a board.
- `DELETE /api/boards/:tenantId/:boardId` deletes a board and its related columns and tasks.

Every board service query is scoped by `tenantId`; members can view boards but cannot create, update, or delete them.

## Column APIs

- `POST /api/columns` creates a column for the board and tenant IDs in the request body.
- `GET /api/columns/:tenantId/:boardId` lists columns and their ordered tasks.
- `GET /api/columns/:tenantId/:boardId/:columnId` fetches one column.
- `PUT /api/columns/:tenantId/:boardId/:columnId` updates a column name.
- `DELETE /api/columns/:tenantId/:boardId/:columnId` deletes a column and cascades to its tasks.
- `PATCH /api/columns/:tenantId/:boardId/reorder` reorders all columns using a `columnIds` array.

All endpoints require tenant and board access; only organization and tenant admins can modify columns.

## Task APIs

- `POST /api/tasks` creates a task for the tenant, board, and column IDs in the request body.
- `GET /api/tasks/:tenantId/:boardId/:columnId` lists a column's tasks by position.
- `GET /api/tasks/:tenantId/:boardId/:columnId/:taskId` fetches one task.
- `PATCH /api/tasks/:tenantId/:boardId/:columnId/:taskId` updates task fields and requires the current `expectedVersion`.
- `DELETE /api/tasks/:tenantId/:boardId/:columnId/:taskId` deletes a task.

Task updates increment `version`; stale `expectedVersion` values receive HTTP 409.