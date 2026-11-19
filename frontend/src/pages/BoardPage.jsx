import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getBoard } from "../api/workspace.api.js";
import { useWorkspace } from "../context/useWorkspace.js";

const BoardPage = () => {
    const { boardId } = useParams();
    const { selectedTenant } = useWorkspace();
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const loadBoard = async () => {
            setBoard(null);
            setError("");

            if (!selectedTenant) {
                return;
            }

            setLoading(true);

            try {
                const selectedBoard = await getBoard(
                    selectedTenant.id,
                    boardId
                );

                if (active) {
                    setBoard(selectedBoard);
                }
            } catch (requestError) {
                if (active) {
                    setError(
                        requestError.response?.data?.message ||
                        "Board not found in this branch"
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadBoard();

        return () => {
            active = false;
        };
    }, [boardId, selectedTenant]);

    if (!selectedTenant) {
        return (
            <main className="board-page">
                <p>Select a branch before opening a board.</p>
                <Link to="/dashboard">Back to workspace</Link>
            </main>
        );
    }

    return (
        <main className="board-page">
            <Link to="/dashboard">Back to workspace</Link>
            {loading && <p>Loading board...</p>}
            {error && <p className="error-message">{error}</p>}
            {board && (
                <section className="board-placeholder">
                    <h1>{board.name}</h1>
                    <p>Branch: {selectedTenant.name}</p>
                    <p>Selected Board ID: {board.id}</p>
                    <p>
                        Kanban columns and tasks will be implemented in
                        Milestone 9C.
                    </p>
                </section>
            )}
        </main>
    );
};

export default BoardPage;
