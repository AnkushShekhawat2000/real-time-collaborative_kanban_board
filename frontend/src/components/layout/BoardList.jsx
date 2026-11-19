import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getBoards } from "../../api/workspace.api.js";
import { useWorkspace } from "../../context/useWorkspace.js";

const BoardList = () => {
    const { selectedTenant } = useWorkspace();
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
