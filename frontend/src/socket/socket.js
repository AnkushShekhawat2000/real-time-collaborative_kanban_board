import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket;

export const connectSocket = (token) => {
    if (!token) {
        throw new Error("Authentication token missing");
    }

    if (socket) {
        socket.auth = { token };

        if (!socket.connected) {
            socket.connect();
        }

        return socket;
    }

    socket = io(SOCKET_URL, {
        autoConnect: false,
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    socket.connect();
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
