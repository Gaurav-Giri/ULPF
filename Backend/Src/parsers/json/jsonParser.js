export function parseJson(payload) {
    let data;

    try {
        data = JSON.parse(payload);
    } catch {
        throw new Error("Invalid JSON payload");
    }

    return {
        timestamp:
            data.timestamp ||
            data.time ||
            new Date().toISOString(),

        source: {
            name:
                data.hostname ||
                data.host ||
                data.source ||
                "unknown",

            type:
                data.source_type ||
                "application",

            vendor: data.vendor
        },

        event: {
            category:
                data.category ||
                "unknown",

            action: data.action,

            severity:
                data.severity ||
                data.level
        },

        network: {
            source_ip:
                data.source_ip ||
                data.src_ip,

            destination_ip:
                data.destination_ip ||
                data.dst_ip,

            source_port:
                data.source_port ||
                data.src_port,

            destination_port:
                data.destination_port ||
                data.dst_port,

            protocol:
                data.protocol
        },

        message:
            data.message
    };
}