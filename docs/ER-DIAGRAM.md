# Database ER Diagram

This diagram reflects the models and relations currently defined in
`backend/prisma/schema.prisma`.

```mermaid
erDiagram
    ORGANIZATION {
        string id PK
        string name
        string slug UK
        datetime createdAt
        datetime updatedAt
    }

    TENANT {
        string id PK
        string organizationId FK
        string name
        string slug
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    MEMBERSHIP {
        string id PK
        string userId FK
        string organizationId FK
        string tenantId FK "optional"
        enum role
        datetime createdAt
        datetime updatedAt
    }

    BOARD {
        string id PK
        string tenantId FK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }

    COLUMN {
        string id PK
        string boardId FK
        string name
        int position
        datetime createdAt
        datetime updatedAt
    }

    TASK {
        string id PK
        string columnId FK
        string createdById FK "optional"
        string assigneeId FK "optional"
        string title
        string description
        enum status
        enum priority
        datetime dueDate
        int position
        int version
        datetime createdAt
        datetime updatedAt
    }

    ACTIVITY_LOG {
        string id PK
        string tenantId FK
        string userId FK "optional"
        string entityType
        string entityId
        string action
        json metadata
        datetime createdAt
    }

    ORGANIZATION ||--o{ TENANT : owns
    ORGANIZATION ||--o{ MEMBERSHIP : grants
    TENANT o|--o{ MEMBERSHIP : scopes
    USER ||--o{ MEMBERSHIP : has
    TENANT ||--o{ BOARD : contains
    BOARD ||--o{ COLUMN : contains
    COLUMN ||--o{ TASK : contains
    USER o|--o{ TASK : creates
    USER o|--o{ TASK : assigned
    TENANT ||--o{ ACTIVITY_LOG : records
    USER o|--o{ ACTIVITY_LOG : performs
```

## Tenant scope

`Task` and `Column` do not store a direct `tenantId`. Their tenant is derived
through `Task.columnId -> Column.boardId -> Board.tenantId`. API middleware
authorizes the tenant and board before task and column operations.

`Membership.tenantId` is optional: an organization-level `ORG_ADMIN`
membership has no tenant ID, while tenant-scoped memberships grant access only
to their assigned tenant. The current schema has no `TaskHistory` model;
optimistic concurrency is tracked by `Task.version`, and changes are recorded
in `ActivityLog.metadata`. A migration repairs existing position collisions
and enforces uniqueness of `(columnId, position)` for tasks.
