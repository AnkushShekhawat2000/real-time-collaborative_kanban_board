import { Server } from "socket.io";

import prisma from "../config/prisma.js";
import { socketAuth } from "./socketAuth.js";

const tenantUsers = new Map();

const removePresence = (io, tenantId, userId) => {
    const users = tenantUsers.get(tenantId);

    if (!users || !users.has(userId)) {
        return;
    }

    const user = users.get(userId);
    user.count -= 1;

    if (user.count <= 0) {
        users.delete(userId);
    }

    if (users.size === 0) {
        tenantUsers.delete(tenantId);
    }

    io.to(`tenant:${tenantId}`).emit(
        "presence:updated",
        Array.from(users?.values() || []).map(({ id, name }) => ({
            id,
            name,
        }))
    );
};

export const revokeTenantUserAccess = async (io, tenantId, userId) => {
    const room = `tenant:${tenantId}`;
    const sockets = await io.in(room).fetchSockets();

    for (const socket of sockets) {
        if (socket.user.id === userId) {
            socket.emit("tenant:access-revoked", { tenantId });
            await socket.leave(room);
            removePresence(io, tenantId, userId);
        }
    }
};

export const revokeTenantRoom = async (io, tenantId) => {
    const room = `tenant:${tenantId}`;
    const sockets = await io.in(room).fetchSockets();

    io.to(room).emit("tenant:deleted", { tenantId });

    for (const socket of sockets) {
        await socket.leave(room);
    }

    tenantUsers.delete(tenantId);
    io.to(room).emit("presence:updated", []);
};

export const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.use(socketAuth);

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.user.id);

        socket.on("tenant:join", async (tenantId, callback) => {
            try {
                if (typeof tenantId !== "string" || !tenantId) {
                    return callback?.({
                        success: false,
                        message: "Invalid tenant ID",
                    });
                }

                const tenant = await prisma.tenant.findUnique({
                    where: { id: tenantId },
                    select: { id: true, organizationId: true },
                });

                if (!tenant) {
                    return callback?.({
                        success: false,
                        message: "Tenant access denied",
                    });
                }

                const membership = await prisma.membership.findFirst({
                    where: {
                        userId: socket.user.id,
                        organizationId: tenant.organizationId,
                        OR: [
                            {
                                tenantId,
                                role: { in: ["TENANT_ADMIN", "MEMBER"] },
                            },
                            {
                                tenantId: null,
                                role: "ORG_ADMIN",
                            },
                        ],
                    },
                });

                if (!membership) {
                    return callback?.({
                        success: false,
                        message: "Tenant access denied",
                    });
                }

                const room = `tenant:${tenantId}`;

                if (socket.rooms.has(room)) {
                    const users = tenantUsers.get(tenantId);
                    socket.emit(
                        "presence:updated",
                        Array.from(users?.values() || []).map(
                            ({ id, name }) => ({ id, name })
                        )
                    );
                    return callback?.({
                        success: true,
                        message: "Tenant room already joined",
                        tenantId,
                    });
                }

                for (const existingRoom of [...socket.rooms]) {
                    if (existingRoom.startsWith("tenant:")) {
                        const previousTenantId = existingRoom.slice(
                            "tenant:".length
                        );
                        await socket.leave(existingRoom);
                        removePresence(io, previousTenantId, socket.user.id);
                    }
                }

                await socket.join(room);

                if (!tenantUsers.has(tenantId)) {
                    tenantUsers.set(tenantId, new Map());
                }

                const users = tenantUsers.get(tenantId);
                const existing = users.get(socket.user.id);

                if (existing) {
                    existing.count += 1;
                } else {
                    users.set(socket.user.id, {
                        id: socket.user.id,
                        name: socket.user.name,
                        count: 1,
                    });
                }

                io.to(room).emit(
                    "presence:updated",
                    Array.from(users.values()).map(({ id, name }) => ({
                        id,
                        name,
                    }))
                );

                callback?.({
                    success: true,
                    message: "Tenant room joined",
                    tenantId,
                });
            } catch (error) {
                console.error("Tenant join error:", error);

                callback?.({
                    success: false,
                    message: "Unable to join tenant room",
                });
            }
        });

        socket.on("tenant:leave", async (tenantId, callback) => {
            const room = `tenant:${tenantId}`;

            if (!socket.rooms.has(room)) {
                return callback?.({
                    success: false,
                    message: "Room not joined",
                });
            }

            await socket.leave(room);
            removePresence(io, tenantId, socket.user.id);

            callback?.({ success: true });
        });

        socket.on("disconnecting", () => {
            console.log("Socket disconnected:", socket.user.id);

            for (const room of socket.rooms) {
                if (room.startsWith("tenant:")) {
                    removePresence(
                        io,
                        room.slice("tenant:".length),
                        socket.user.id
                    );
                }
            }
        });
    });

    return io;
};
