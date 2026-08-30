// import "./config/env.js";

// import express from "express";
// import cors from "cors";

// const app = express();

// app.use(
//     cors({
//         origin: process.env.FRONTEND_URL
//     })
// );

// app.use(express.json());

// app.get("/api/health", (req, res) => {
//     res.json({
//         status: "ok",
//         service: "ULPF Backend",
//         environment: process.env.NODE_ENV
//     });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`ULPF Backend running on port ${PORT}`);
// });




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
import {
    publishEvent
} from "./queues/eventProducer.js";
import {
    registerAllParsers
} from "./parsers/registry/registerParsers.js";
import {
    getSupportedFormats
} from "./parsers/registry/parserRegistry.js";
import {
    startEventWorker
} from "./workers/eventWorker.js";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL
    })
);
app.use(
    "/api/v1/events",
    eventRoutes
);
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "ULPF Backend",
        environment: process.env.NODE_ENV
    });
});

app.post("/api/v1/events", (req, res) => {
    try {
        const event = {
            ...req.body,
            received_at: new Date().toISOString()
        };

        publishEvent(event);

        res.status(202).json({
            status: "accepted",
            message: "Event accepted for processing"
        });
    } catch (error) {
        console.error(
            "Failed to publish event:",
            error.message
        );

        res.status(500).json({
            status: "error",
            message: "Failed to queue event"
        });
    }
});

const PORT = env.port;

registerAllParsers();

async function startServer() {
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
            getSupportedFormats()
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