import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { getTenantActivities } from "../../api/activity.api.js";
import { useRealtime } from "../../context/useRealtime.js";
import { useWorkspace } from "../../context/useWorkspace.js";

const ActivityFeed = () => {
    const { selectedTenant } = useWorkspace();
    const { socket } = useRealtime();
    const requestIdRef = useRef(0);
    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadedTenantId, setLoadedTenantId] = useState(null);
    const [error, setError] = useState("");

    const loadActivities = useCallback(async (nextPage = 1) => {
        if (!selectedTenant) {
            return;
        }

        setError("");
        const requestId = ++requestIdRef.current;

        try {
            const tenantId = selectedTenant.id;
            const result = await getTenantActivities(tenantId, nextPage);
            if (requestId !== requestIdRef.current) {
                return;
            }
            setActivities(result.activities || []);
            setPage(result.pagination.page);
            setTotalPages(result.pagination.totalPages);
            setLoadedTenantId(tenantId);
        } catch (requestError) {
            if (requestId !== requestIdRef.current) {
                return;
            }
            setError(
                requestError.response?.data?.message ||
                "Failed to load activity"
            );
        }
    }, [selectedTenant]);

    useEffect(() => {
        if (!selectedTenant) {
            return undefined;
        }

        let active = true;
        const requestId = ++requestIdRef.current;

        getTenantActivities(selectedTenant.id)
            .then((result) => {
                if (active && requestId === requestIdRef.current) {
                    setActivities(result.activities || []);
                    setPage(result.pagination.page);
                    setTotalPages(result.pagination.totalPages);
                    setLoadedTenantId(selectedTenant.id);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (active && requestId === requestIdRef.current) {
                    setError(
                        requestError.response?.data?.message ||
                        "Failed to load activity"
                    );
                    setLoadedTenantId(selectedTenant.id);
                }
            });

        return () => {
            active = false;
        };
    }, [selectedTenant]);

    useEffect(() => {
        if (!socket || !selectedTenant) {
            return undefined;
        }

        const refreshActivity = (event) => {
            if (event.tenantId === selectedTenant.id) {
                void loadActivities(1);
            }
        };
        const eventNames = [
            "task:created",
            "task:updated",
            "task:moved",
            "task:deleted",
            "task:assigned",
            "task:reordered",
        ];

        eventNames.forEach((eventName) => {
            socket.on(eventName, refreshActivity);
        });
        const handleReconnect = () => {
            void loadActivities(1);
        };
        socket.on("connect", handleReconnect);

        return () => {
            eventNames.forEach((eventName) => {
                socket.off(eventName, refreshActivity);
            });
            socket.off("connect", handleReconnect);
        };
    }, [loadActivities, selectedTenant, socket]);

    if (!selectedTenant) {
        return null;
    }

    return (
        <section className="activity-feed" aria-label="Recent activity">
            <div className="activity-heading">
                <button
                    type="button"
                    aria-label="Refresh activity"
                    onClick={() => void loadActivities(page)}
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
            {loadedTenantId !== selectedTenant.id && <p>Loading activity...</p>}
            {loadedTenantId === selectedTenant.id &&
                activities.length === 0 &&
                !error && <p>No activity yet.</p>}
            {loadedTenantId === selectedTenant.id && (
            <ul>
                {activities.map((activity) => (
                    <li key={activity.id}>
                        <strong>
                            {activity.user?.name || "A user"}{" "}
                            {activity.action.toLowerCase().replaceAll("_", " ")}
                        </strong>
                        {activity.metadata?.title && (
                            <span> — {activity.metadata.title}</span>
                        )}
                        <time dateTime={activity.createdAt}>
                            {new Date(activity.createdAt).toLocaleString()}
                        </time>
                    </li>
                ))}
            </ul>
            )}
            <div className="activity-pagination">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => void loadActivities(page - 1)}
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => void loadActivities(page + 1)}
                >
                    Next
                </button>
            </div>
        </section>
    );
};

export default ActivityFeed;
