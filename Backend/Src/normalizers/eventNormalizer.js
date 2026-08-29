// import crypto from "crypto";

// export function normalizeEvent({
//     eventId,
//     receivedAt,
//     source,
//     format,
//     payload
// }) {
//     const sha256 = crypto
//         .createHash("sha256")
//         .update(payload)
//         .digest("hex");

//     return {
//         event_id: eventId,

//         timestamp:
//             source.timestamp ||
//             receivedAt,

//         received_at: receivedAt,

//         source: source.source,

//         event: source.event,

//         network: source.network,

//         message: source.message,

//         metadata: source.metadata,

//         raw: {
//             format,
//             payload,
//             sha256
//         }
//     };
// }







import crypto from "crypto";

export function normalizeEvent({
    eventId,
    receivedAt,
    source,
    format,
    payload
}) {
    const sha256 = crypto
        .createHash("sha256")
        .update(payload)
        .digest("hex");

    return {
        event_id: eventId,

        timestamp:
            source.timestamp ||
            receivedAt,

        received_at: receivedAt,

        source: source.source,

        event: source.event,

        network: source.network,

        message: source.message,

        metadata: source.metadata,

        raw: {
            format,

            sha256
        }
    };
}