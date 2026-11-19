import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getBoards } from "../../api/workspace.api.js";
import { useWorkspace } from "../../context/useWorkspace.js";
import { useRealtime } from "../../context/useRealtime.js";

const BoardList = () => {
    const { selectedTenant } = useWorkspace();
    const { socket } = useRealtime();
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const loadBoards = async () => {
            setBoards([]);
            setError("");

            if (!selectedTenant) {
                return;
            }

            setLoading(true);

            try {
                const tenantBoards = await getBoards(selectedTenant.id);

                if (active) {
                    setBoards(tenantBoards);
                }
            } catch (requestError) {
                if (active) {
                    setError(
                        requestError.response?.data?.message ||
                        "Unable to load boards"
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadBoards();

        return () => {
            active = false;
        };
    }, [selectedTenant]);

    useEffect(() => {
        if (!socket || !selectedTenant) {
            return undefined;
        }

        let active = true;
        const handleBoardChange = async (event) => {
            if (event.tenantId !== selectedTenant.id) {
                return;
            }

            try {
                const tenantBoards = await getBoards(selectedTenant.id);
                if (active) {
                    setBoards(tenantBoards);
                    setError("");
                }
            } catch (requestError) {
                if (active) {
                    setError(
                        requestError.response?.data?.message ||
                        "Unable to refresh boards"
                    );
                }
            }
        };

        socket.on("board:created", handleBoardChange);
        socket.on("board:updated", handleBoardChange);
        socket.on("board:deleted", handleBoardChange);

        return () => {
            active = false;
            socket.off("board:created", handleBoardChange);
            socket.off("board:updated", handleBoardChange);
            socket.off("board:deleted", handleBoardChange);
        };
    }, [selectedTenant, socket]);

    if (!selectedTenant) {
        return <p>Select a branch to see boards.</p>;
    }

    if (loading) {
        return <p>Loading boards...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div className="board-list">
            <h3>Boards</h3>
            {boards.length === 0 && <p>No boards found.</p>}

            {boards.map((board) => (
                <Link
                    key={board.id}
                    to={`/boards/${board.id}`}
                    className="board-link"
                >
                    {board.name}
                </Link>
            ))}
        </div>
    );
};

export default BoardList;
