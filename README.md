# Real-Time Collaborative Kanban Board

A multi-organization, multi-tenant Kanban application with JWT authentication,
tenant-scoped authorization, optimistic task updates, and Socket.IO
collaboration.

## Features

- Organization and tenant membership support
- Organization and branch (tenant) CRUD with role-aware member management
- Role-based access control for organizations, branches, boards, and columns
- Tenant-scoped boards, columns, and tasks
- Task create, edit, delete, assignment, and drag-and-drop
- Real-time board/task synchronization and per-tenant online presence
- Optimistic concurrency control using task versions
- Paginated tenant activity feed
- Undo/redo for task moves in the current board session
- Zod validation for task create/update requests

## Technology

- **Backend:** Node.js, Express, Prisma, PostgreSQL, Socket.IO, JWT, Zod
- **Frontend:** React, Vite, React Router, Socket.IO Client, dnd-kit

## Architecture

```text
Organization -> Tenant -> Board -> Column -> Task
```

Tenant membership is checked before board, column, task, and activity
operations. A task's tenant is derived through its column and board; tasks do
not store a separate `tenantId`. Task positions are unique per column and are
updated transactionally; stale task edits and concurrent moves return a
conflict instead of silently overwriting one another.

`ORG_ADMIN` can manage all branches in their organization and assign branch
roles. `TENANT_ADMIN` manages members and boards/columns in assigned branches;
`MEMBER` can collaborate on tasks in assigned branches. Tenant admins can add
regular members but cannot promote users to tenant admin.

## Requirements

- Node.js `20.19+`, `22.12+`, or `24+`
- PostgreSQL

## Setup

### Backend

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env`, then set a PostgreSQL
`DATABASE_URL` and a long random `JWT_SECRET`.

```bash
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```

The API and Socket.IO server default to `http://localhost:5000`.

### Frontend

In another terminal:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env` if you need to override the
default API or Socket.IO URLs.

```bash
npm run dev
```

## Validation

```bash
cd backend
npm test
```

```bash
cd frontend
npm run lint
npm run build
```

The automated backend tests cover task validation, status mapping, and
membership-role policy. See [Security Notes and Verification](./docs/SECURITY.md)
for tenant-isolation checks to perform against a seeded database. Database
migrations normalize task positions before enforcing uniqueness per column and
add the default To Do, In Progress, and Done columns to existing empty boards.

## Documentation

- [API reference](./docs/API.md)
- [Database ER diagram](./docs/ER-DIAGRAM.md)
- [Security notes and verification checklist](./docs/SECURITY.md)
- [Socket.IO events](./docs/SOCKET-EVENTS.md)

## Environment variables

Backend: `DATABASE_URL`, `JWT_SECRET`, optional `JWT_EXPIRES_IN`, `PORT`, and
`CLIENT_URL`.

Frontend: `VITE_API_URL` and `VITE_SOCKET_URL`.

Never commit `.env` files or real credentials.

## Deployment notes

Socket.IO presence is held in process memory. Multi-instance deployments need
a shared Socket.IO adapter and distributed presence tracking. JWT logout
currently removes the token from the client; tokens remain valid until their
configured expiration. Undo/redo currently covers task moves in the active
board session; it is cleared after remote changes, board changes, or conflicts.
Member addition is by email for already registered users; email invitation
delivery is not implemented.
