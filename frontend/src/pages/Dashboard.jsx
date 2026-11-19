import { useAuth } from "../context/useAuth.js";

const Dashboard = () => {
    const { user, logout } = useAuth();
    const memberships = user?.memberships || [];

    return (
        <main className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>Kanban Workspace</h1>
                    <p>Welcome, {user?.name || user?.email}</p>
                </div>
                <button type="button" onClick={logout}>
                    Logout
                </button>
            </header>

            <section className="dashboard-card">
                <h2>Your memberships</h2>
                {memberships.length > 0 ? (
                    <ul className="membership-list">
                        {memberships.map((membership) => (
                            <li key={membership.id}>
                                {membership.organization?.name}
                                {membership.tenant?.name
                                    ? ` — ${membership.tenant.name}`
                                    : " — Organization"}
                                {" · "}
                                {membership.role}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>
                        You are signed in, but no organization or tenant
                        memberships are available yet.
                    </p>
                )}
            </section>
        </main>
    );
};

export default Dashboard;
