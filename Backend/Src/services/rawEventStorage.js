import { minioClient, RAW_BUCKET } from "../config/minio.js";

export async function storeRawEvent(event) {
    const date = new Date(event.received_at);

    const year = date.getUTCFullYear();
    const month = String(
        date.getUTCMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getUTCDate()
    ).padStart(2, "0");

    const objectName =
        `${year}/${month}/${day}/${event.event_id}.json`;

    const content = JSON.stringify(
        event,
        null,
        2
    );

    const buffer = Buffer.from(content);

    await minioClient.putObject(
        RAW_BUCKET,
        objectName,
        buffer,
        buffer.length,
        {
            "Content-Type": "application/json"
        }
    );

    return {
        bucket: RAW_BUCKET,
        object: objectName
    };
}