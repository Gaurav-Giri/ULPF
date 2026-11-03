import "./config/env.js";
import { env } from "./config/env.js";
import express from "express";
import cors from "cors";
import {
    initializeMinIO
} from "./config/minio.js";
import {
    initializeOpenSearch
} from "./config/opensearch.js";
import {
    connectRabbitMQ
} from "./config/rabbitmq.js";
import eventRoutes from "./routes/eventRoutes.js";
import parserRoutes from "./routes/parserRoutes.js";
import detectRoutes from "./routes/detectRoutes.js";
import {
    pluginManager
} from "./core/plugins/pluginManager.js";
import {
    pluginRegistry
} from "./core/plugins/pluginRegistry.js";
import {
    startEventWorker
} from "./workers/eventWorker.js";

const app = express();

app.use(
    cors({
        origin: env.frontendUrl
    })
);

app.use(express.json());

app.use(
    "/api/v1/events",
    eventRoutes
);

app.use(
    "/api/v1/parsers",
    parserRoutes
);

app.use(
    "/api/v1/detect",
    detectRoutes
);

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "ULPF Backend",
        environment: env.nodeEnv
    });
});

const PORT = env.port;

async function startServer() {
    // 1. Discover and load parser plugins
    await pluginManager.loadPlugins();

    // 2. Initialize infrastructure
    await connectRabbitMQ();
    await initializeMinIO();
    await initializeOpenSearch();
    await startEventWorker();

    app.listen(PORT, () => {
        console.log(
            `ULPF Backend running on port ${PORT}`
        );
        console.log(
            "Supported formats:",
            pluginRegistry.getSupportedFormats()
        );
    });
}

startServer().catch((error) => {
    console.error(
        "Failed to start ULPF:",
        error
    );

    process.exit(1);
});