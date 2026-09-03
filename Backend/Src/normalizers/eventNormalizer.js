export function normalizeEvent({
    eventId,
    receivedAt,
    source,
    rawSource,
    format,
    payload,
    rawSha256
}) {
    return {
        event_id: eventId,

        timestamp:
            source.timestamp ||
            receivedAt,

        received_at:
            receivedAt,

        source: {
            name: (source.source?.name && source.source.name !== "unknown")
                ? source.source.name
                : (rawSource || "unknown"),
            type: source.source?.type || "unknown",
            vendor: source.source?.vendor
        },

        event: {
            category: source.event?.category || "unknown",
            action: source.event?.action,
            severity: source.event?.severity !== undefined ? String(source.event.severity) : undefined
        },

        network: {
            source_ip: source.network?.source_ip,
            destination_ip: source.network?.destination_ip,
            source_port: source.network?.source_port,
            destination_port: source.network?.destination_port,
            protocol: source.network?.protocol
        },

        message: source.message,

        metadata: source.metadata,

        raw: {
            format,
            sha256: rawSha256
        }
    };
}