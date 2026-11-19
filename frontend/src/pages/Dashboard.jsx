import { useState } from "react";

import BoardList from "../components/layout/BoardList.jsx";
import CreateBoard from "../components/layout/CreateBoard.jsx";
import WorkspaceSelector from "../components/layout/WorkspaceSelector.jsx";
import { useAuth } from "../context/useAuth.js";
import { useWorkspace } from "../context/useWorkspace.js";

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { selectedTenant } = useWorkspace();
    const [refreshKey, setRefreshKey] = useState(0);
    const canCreateBoard = user?.memberships?.some(
        (membership) =>
            (
                membership.tenantId === selectedTenant?.id &&
                ["TENANT_ADMIN", "ORG_ADMIN"].includes(membership.role)
            ) ||
            (
                membership.organizationId ===
                    selectedTenant?.organizationId &&
                membership.tenantId === null &&
                membership.role === "ORG_ADMIN"
            )
    );

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <h2>Kanban Workspace</h2>
                <WorkspaceSelector />
                <hr />
                <BoardList key={refreshKey} />
                {canCreateBoard && (
                    <CreateBoard
                        onCreated={() => {
                            setRefreshKey((old) => old + 1);
                        }}
                    />
                )}
            </aside>

            <main className="dashboard-main">
                <header className="workspace-header">
                    <div>
                        <h1>My Workspace</h1>
                        <p>{selectedTenant?.name || "Select a branch"}</p>
                    </div>
                    <div className="workspace-user">
                        <span>{user?.name || user?.email}</span>
                        <button type="button" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </header>

                <section className="dashboard-content">
                    <h2>Welcome to your Kanban Workspace</h2>
                    <p>Select a branch and create or open a board.</p>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
