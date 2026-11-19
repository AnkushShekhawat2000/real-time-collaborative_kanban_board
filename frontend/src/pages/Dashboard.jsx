import { useState } from "react";
import {
    Activity,
    Building2,
    LogOut,
    PanelsTopLeft,
    Settings2,
    Sparkles,
    UsersRound,
} from "lucide-react";

import BoardList from "../components/layout/BoardList.jsx";
import ActivityFeed from "../components/layout/ActivityFeed.jsx";
import CreateBoard from "../components/layout/CreateBoard.jsx";
import CreateOrganization from "../components/layout/CreateOrganization.jsx";
import TenantManagement from "../components/layout/TenantManagement.jsx";
import TenantMembers from "../components/layout/TenantMembers.jsx";
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
    const userInitials = (user?.name || user?.email || "U")
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <span className="sidebar-brand-icon">
                        <PanelsTopLeft size={20} strokeWidth={2.2} />
                    </span>
                    <div>
                        <h2>Kanban Workspace</h2>
                        <span>TEAM WORKSPACE</span>
                    </div>
                </div>
                <WorkspaceSelector />
                <details className="sidebar-settings">
                    <summary>
                        <Settings2 size={16} />
                        <span>Organization settings</span>
                    </summary>
                    <CreateOrganization />
                </details>
                <details className="sidebar-settings">
                    <summary>
                        <Building2 size={16} />
                        <span>Branch settings</span>
                    </summary>
                    <TenantManagement />
                </details>
                <nav className="sidebar-boards" aria-label="Workspace boards">
                    <BoardList key={refreshKey} />
                </nav>
                {canCreateBoard && (
                    <section className="sidebar-create-board">
                        <h3>Create a board</h3>
                        <p>Start organizing your team&apos;s work.</p>
                        <CreateBoard
                            onCreated={() => {
                                setRefreshKey((old) => old + 1);
                            }}
                        />
                    </section>
                )}
            </aside>

            <main className="dashboard-main">
                <header className="workspace-header">
                    <div className="workspace-breadcrumb">
                        <span>Workspace</span>
                        <span className="breadcrumb-divider">/</span>
                        <strong>{selectedTenant?.name || "Select a branch"}</strong>
                    </div>
                    <div className="workspace-user">
                        <span className="user-avatar" aria-hidden="true">
                            {userInitials}
                        </span>
                        <span className="workspace-user-name">
                            {user?.name || user?.email}
                        </span>
                        <button type="button" onClick={logout} aria-label="Log out">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </header>

                <section className="dashboard-content">
                    <div className="dashboard-welcome">
                        <div className="welcome-copy">
                            <span className="welcome-eyebrow">
                                <Sparkles size={14} />
                                WORKSPACE OVERVIEW
                            </span>
                            <h1>Your work, all in one place.</h1>
                            <p>
                                {selectedTenant
                                    ? `Keep up with the people and progress in ${selectedTenant.name}.`
                                    : "Select a branch to see your team and its latest activity."}
                            </p>
                        </div>
                        <div className="welcome-branch">
                            <span className="welcome-branch-icon">
                                <Building2 size={19} />
                            </span>
                            <div>
                                <span>ACTIVE BRANCH</span>
                                <strong>{selectedTenant?.name || "None selected"}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-panels">
                        <div className="dashboard-panel dashboard-members-panel">
                            <div className="dashboard-panel-heading">
                                <span className="dashboard-panel-icon members-icon">
                                    <UsersRound size={18} />
                                </span>
                                <div>
                                    <h2>Branch members</h2>
                                    <p>Manage the people in this workspace.</p>
                                </div>
                            </div>
                            <TenantMembers />
                        </div>
                        <div className="dashboard-panel dashboard-activity-panel">
                            <div className="dashboard-panel-heading">
                                <span className="dashboard-panel-icon activity-icon">
                                    <Activity size={18} />
                                </span>
                                <div>
                                    <h2>Recent activity</h2>
                                    <p>The latest updates from your team.</p>
                                </div>
                            </div>
                            <ActivityFeed />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
