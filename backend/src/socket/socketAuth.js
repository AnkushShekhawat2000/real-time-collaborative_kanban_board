import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        if (typeof userId !== "string" || !userId) {
            return next(new Error("Invalid token payload"));
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (!user) {
            return next(new Error("User not found"));
        }

        socket.user = user;
        next();
    } catch (error) {
        console.error("Socket authentication error:", error.message);
        next(new Error("Invalid or expired token"));
    }
};
