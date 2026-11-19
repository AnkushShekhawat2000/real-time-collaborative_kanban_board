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