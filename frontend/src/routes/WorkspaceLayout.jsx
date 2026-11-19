import { Outlet } from "react-router-dom";

import { WorkspaceProvider } from "../context/WorkspaceContext.jsx";
import { RealtimeProvider } from "../context/RealtimeContext.jsx";

const WorkspaceLayout = () => (
    <WorkspaceProvider>
        <RealtimeProvider>
            <Outlet />
        </RealtimeProvider>
    </WorkspaceProvider>
);

export default WorkspaceLayout;
