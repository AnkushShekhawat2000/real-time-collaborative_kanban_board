import {
    useEffect,
    useState,
} from "react";

import { useAuth } from "./useAuth.js";
import { useWorkspace } from "./useWorkspace.js";
import RealtimeContext from "./realtimeContext.js";
import {
    connectSocket,
    disconnectSocket,
    getSocket,
} from "../socket/socket.js";

export const RealtimeProvider = ({ children }) => {
    const { user } = useAuth();
    const { selectedTenant } = useWorkspace();
    const [connectedTenantId, setConnectedTenantId] = useState(null);
    const [presence, setPresence] = useState({
        tenantId: null,
        users: [],
    });

    useEffect(() => {
        const tenantId = selectedTenant?.id;
        const token = localStorage.getItem("token");

        if (!token || !tenantId || !user?.id) {
            disconnectSocket();
            return undefined;
        }

        const socket = connectSocket(token);

        const joinTenant = () => {
            socket.emit("tenant:join", tenantId, (response) => {
                if (!response?.success) {
                    console.error(
                        "Tenant room access denied:",
                        response?.message
                    );
                    return;
                }

                setConnectedTenantId(tenantId);
            });
        };

        const handleConnect = () => {
            setConnectedTenantId(tenantId);
            joinTenant();
        };

        const handleDisconnect = () => {
            setConnectedTenantId(null);
        };

        const handleConnectError = (error) => {
            console.error("Socket connection failed:", error.message);
        };

        const handlePresenceUpdate = (users) => {
            setPresence({ tenantId, users });
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("presence:updated", handlePresenceUpdate);

        if (socket.connected) {
            joinTenant();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("presence:updated", handlePresenceUpdate);

            if (socket.connected) {
                socket.emit("tenant:leave", tenantId);
            }
        };
    }, [selectedTenant?.id, user?.id]);

    useEffect(() => () => {
        disconnectSocket();
    }, []);

    const socket = getSocket();
    const onlineUsers = presence.tenantId === selectedTenant?.id
        ? presence.users
        : [];

    return (
        <RealtimeContext.Provider
            value={{
                connected: Boolean(
                    selectedTenant?.id &&
                    connectedTenantId === selectedTenant.id
                ),
                onlineUsers,
                socket,
            }}
        >
            {children}
        </RealtimeContext.Provider>
    );
};
