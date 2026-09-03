export function parseLeef(payload) {
    if (!payload || typeof payload !== "string") {
        throw new Error("Invalid LEEF payload");
    }

    const trimmed = payload.trim();

    /*
     * LEEF format:
     * LEEF:Version|Vendor|Product|Version|EventID|Extension
     */

    if (!/^LEEF:\d+\.\d+\|/i.test(trimmed)) {
        throw new Error("Invalid LEEF format");
    }

    const parts = trimmed.split("|");

    if (parts.length < 6) {
        throw new Error(
            "Invalid LEEF payload: incomplete header"
        );
    }

    const [
        leefVersion,
        vendor,
        product,
        productVersion,
        eventId,
        ...extensionParts
    ] = parts;

    const extensionText = extensionParts.join("|").trim();
    const extensions = {};

    const regex = /(?:^|\t|\s+)([A-Za-z0-9_.-]+)=("(?:[^"\\]|\\.)*"|'[^']*'|.*?(?=\s+[A-Za-z0-9_.-]+=|$))/g;

    let match;
    while ((match = regex.exec(extensionText)) !== null) {
        const key = match[1].trim();
        let value = match[2].trim();

        if (
            value.length >= 2 &&
            ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'")))
        ) {
            value = value.slice(1, -1);
        }

        if (key) {
            extensions[key] = value;
        }
    }

    const toNumber = (value) => {
        if (value === undefined || value === null || value === "") return undefined;
        const number = Number(value);
        return Number.isNaN(number) ? undefined : number;
    };

    let timestamp = new Date().toISOString();
    const timeValue = extensions.devTime || extensions.eventTime || extensions.rt;

    if (timeValue) {
        const milliseconds = Number(timeValue);
        if (!Number.isNaN(milliseconds)) {
            const date = new Date(milliseconds);
            if (!Number.isNaN(date.getTime())) {
                timestamp = date.toISOString();
            }
        } else {
            const date = new Date(timeValue);
            if (!Number.isNaN(date.getTime())) {
                timestamp = date.toISOString();
            }
        }
    }

    return {
        timestamp,

        source: {
            name: extensions.devName || product || "unknown",
            type: "network_device",
            vendor: vendor || undefined
        },

        event: {
            category: "security",
            action: extensions.action || extensions.eventName || "unknown",
            severity: extensions.severity ? String(extensions.severity) : undefined,
            id: eventId || undefined
        },

        network: {
            source_ip: extensions.src,
            destination_ip: extensions.dst,
            source_port: toNumber(extensions.spt),
            destination_port: toNumber(extensions.dpt),
            protocol: extensions.proto
        },

        message: extensions.msg || extensions.eventName || extensions.action || undefined
    };
}

