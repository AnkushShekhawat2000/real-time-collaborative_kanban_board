WITH ranked_tasks AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "columnId"
            ORDER BY "position", "createdAt", "id"
        ) - 1 AS new_position
    FROM "Task"
)
UPDATE "Task" AS task
SET "position" = ranked_tasks.new_position
FROM ranked_tasks
WHERE task."id" = ranked_tasks."id";

CREATE UNIQUE INDEX "Task_columnId_position_key"
ON "Task"("columnId", "position");
