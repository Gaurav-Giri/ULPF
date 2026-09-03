export function parseCef(payload) {
    if (!payload || typeof payload !== "string") {
        throw new Error("Invalid CEF payload");
    }

    const trimmed = payload.trim();

    /*
     * CEF format:
     * CEF:Version|Device Vendor|Device Product|Device Version|Device Event Class ID|Name|Severity|Extension
     */

    if (!/^CEF:\d+\|/i.test(trimmed)) {
        throw new Error("Invalid CEF format");
    }

    const parts = trimmed.split("|");

    if (parts.length < 7) {
        throw new Error("Invalid CEF payload: incomplete header");
    }

    const [
        cefVersion,
        deviceVendor,
        deviceProduct,
        deviceVersion,
        deviceEventClassId,
        name,
        severity,
        ...extensionParts
    ] = parts;

    const extensionText = extensionParts.join("|").trim();
    const extensions = {};

    const regex = /(?:^|\s+)([A-Za-z0-9_.-]+)=("(?:[^"\\]|\\.)*"|'[^']*'|.*?(?=\s+[A-Za-z0-9_.-]+=|$))/g;

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
    if (extensions.rt) {
        const milliseconds = Number(extensions.rt);
        if (!Number.isNaN(milliseconds)) {
            const date = new Date(milliseconds);
            if (!Number.isNaN(date.getTime())) {
                timestamp = date.toISOString();
            }
        } else {
            const date = new Date(extensions.rt);
            if (!Number.isNaN(date.getTime())) {
                timestamp = date.toISOString();
            }
        }
    }

    return {
        timestamp,

        source: {
            name: extensions.dvchost || deviceProduct || "unknown",
            type: "network_device",
            vendor: deviceVendor || undefined
        },

        event: {
            category: "security",
            action: name || undefined,
            severity: severity ? String(severity) : undefined,
            id: deviceEventClassId || undefined
        },

        network: {
            source_ip: extensions.src,
            destination_ip: extensions.dst,
            source_port: toNumber(extensions.spt),
            destination_port: toNumber(extensions.dpt),
            protocol: extensions.proto
        },

        message: name || extensions.msg || undefined
    };
}