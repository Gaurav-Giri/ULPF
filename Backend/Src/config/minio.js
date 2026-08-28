import { Client } from "minio";
import { env } from "./env.js";

export const minioClient = new Client({
    endPoint: env.minio.endpoint,
    port: env.minio.port,
    useSSL: env.minio.useSSL,
    accessKey: env.minio.accessKey,
    secretKey: env.minio.secretKey
});

export const RAW_BUCKET = "ulpf-raw-events";

export async function initializeMinIO() {
    const exists = await minioClient.bucketExists(
        RAW_BUCKET
    );

    if (!exists) {
        await minioClient.makeBucket(
            RAW_BUCKET,
            "us-east-1"
        );

        console.log(
            `Created MinIO bucket: ${RAW_BUCKET}`
        );
    } else {
        console.log(
            `MinIO bucket exists: ${RAW_BUCKET}`
        );
    }
}