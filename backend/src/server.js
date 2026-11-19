import "dotenv/config";

import express from "express";
import cors from "cors";

import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import boardRoutes from "./routes/board.routes.js";
import columnRoutes from "./routes/column.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});