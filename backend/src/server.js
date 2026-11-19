import "dotenv/config";

import express from "express";
import cors from "cors";
import http from "http";

import prisma from "./config/prisma.js";
import { initializeSocket } from "./socket/socket.js";
import authRoutes from "./routes/auth.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import boardRoutes from "./routes/board.routes.js";
import columnRoutes from "./routes/column.routes.js";
import taskRoutes from "./routes/task.routes.js";
import activityRoutes from "./routes/activity.routes.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);

const httpServer = http.createServer(app);
const io = initializeSocket(httpServer);

app.set("io", io);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
    });
});


app.get("/api/health/db", async (req, res) => {
    try {
        const result = await prisma.$queryRaw`
            SELECT
                current_database() AS database,
                NOW() AS current_time
        `;

        res.status(200).json({
            success: true,
            message: "Database connected successfully",
            data: result,
        });

    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Socket.IO server initialized");
});