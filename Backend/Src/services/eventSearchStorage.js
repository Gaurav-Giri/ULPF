import {
    opensearchClient,
    ULPF_INDEX
} from "../config/opensearch.js";

export async function storeNormalizedEvent(
    normalizedEvent,
    rawStorage
) {
    const document = {
        event_id: normalizedEvent.event_id,

        timestamp: normalizedEvent.timestamp,

        received_at:
            normalizedEvent.received_at,

        source: normalizedEvent.source,

        event: normalizedEvent.event,

        network: normalizedEvent.network,

        message: normalizedEvent.message,

        metadata: normalizedEvent.metadata,

        raw: {
            format: normalizedEvent.raw.format,

            sha256: normalizedEvent.raw.sha256,

            storage: {
                type: "minio",

                bucket: rawStorage.bucket,

                object: rawStorage.object
            }
        }
    };

    await opensearchClient.index({
        index: ULPF_INDEX,

        id: normalizedEvent.event_id,

        body: document,

        refresh: true
    });

    return {
        index: ULPF_INDEX,

        id: normalizedEvent.event_id
    };
}