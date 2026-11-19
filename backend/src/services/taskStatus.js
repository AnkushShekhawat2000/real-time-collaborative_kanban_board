const columnStatuses = {
    "to do": "TODO",
    todo: "TODO",
    "in progress": "IN_PROGRESS",
    done: "DONE",
};

export const statusForColumn = (columnName, fallback = "TODO") => (
    columnStatuses[columnName.trim().toLowerCase()] || fallback
);
