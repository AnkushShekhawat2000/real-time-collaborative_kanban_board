WITH boards_without_columns AS (
    SELECT board."id"
    FROM "Board" AS board
    WHERE NOT EXISTS (
        SELECT 1
        FROM "Column" AS existing_column
        WHERE existing_column."boardId" = board."id"
    )
),
default_columns("name", "position") AS (
    VALUES
        ('To Do', 0),
        ('In Progress', 1),
        ('Done', 2)
)
INSERT INTO "Column" (
    "id",
    "name",
    "position",
    "boardId",
    "createdAt",
    "updatedAt"
)
SELECT
    'backfill_' || md5(board."id" || ':' || default_column."position"::TEXT),
    default_column."name",
    default_column."position",
    board."id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM boards_without_columns AS board
CROSS JOIN default_columns AS default_column;
