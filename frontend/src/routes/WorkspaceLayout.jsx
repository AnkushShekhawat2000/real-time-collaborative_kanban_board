import { Outlet } from "react-router-dom";

import { WorkspaceProvider } from "../context/WorkspaceContext.jsx";

const WorkspaceLayout = () => (
    <WorkspaceProvider>
        <Outlet />
    </WorkspaceProvider>
);

export default WorkspaceLayout;
