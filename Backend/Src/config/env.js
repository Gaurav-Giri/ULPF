import dotenv from "dotenv";

const environment = process.env.NODE_ENV || "development";

dotenv.config({
    path: `.env.${environment}`
});

const requiredVariables = [
    "PORT",
    "RABBITMQ_URL",
    "RABBITMQ_QUEUE",
    "OPENSEARCH_URL",
    "OPENSEARCH_USERNAME",
    "OPENSEARCH_PASSWORD",
    "MINIO_ENDPOINT",
    "MINIO_PORT",
    "MINIO_ACCESS_KEY",
    "MINIO_SECRET_KEY",
    "FRONTEND_URL"
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(`Missing environment variable: ${variable}`);
    }
}

export const env = {
    nodeEnv: environment,

    port: Number(process.env.PORT),

    rabbitmq: {
        url: process.env.RABBITMQ_URL,
        queue: process.env.RABBITMQ_QUEUE
    },

    opensearch: {
        url: process.env.OPENSEARCH_URL,
        username: process.env.OPENSEARCH_USERNAME,
        password: process.env.OPENSEARCH_PASSWORD
    },

    minio: {
        endpoint: process.env.MINIO_ENDPOINT,
        port: Number(process.env.MINIO_PORT),
        useSSL: process.env.MINIO_USE_SSL === "true",
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY
    },

    frontendUrl: process.env.FRONTEND_URL
};