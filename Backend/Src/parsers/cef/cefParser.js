export function parseCef(payload) {
    if (!payload || typeof payload !== "string") {
        throw new Error("Invalid CEF payload");
    }

    const trimmed = payload.trim();

    /*
     * CEF format:
     *
     * CEF:Version|Device Vendor|Device Product|Device Version|
     * Device Event Class ID|Name|Severity|Extension
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

    /*
     * Parse extension key=value pairs.
     *
     * CEF extensions are space separated.
     * Values may contain spaces, so we use a
     * key=value pattern rather than simply split(" ").
     */

    const extensionText =
        extensionParts.join("|");

    const extensions = {};

    const regex =
        /(\w+)=("(?:[^"\\]|\\.)*"|\S+)/g;

    let match;

    while ((match = regex.exec(extensionText)) !== null) {
        let value = match[2];

        if (
            value.startsWith('"') &&
            value.endsWith('"')
        ) {
            value =
                value.slice(1, -1);
        }

        extensions[match[1]] = value;
    }

    /*
     * Helper for numeric values
     */

    const toNumber = (value) => {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return undefined;
        }

        const number =
            Number(value);

        return Number.isNaN(number)
            ? undefined
            : number;
    };


    /*
     * Timestamp
     *
     * CEF may provide rt (receipt time)
     * in milliseconds since epoch.
     */

    let timestamp =
        new Date().toISOString();

    if (extensions.rt) {

        const milliseconds =
            Number(extensions.rt);

        if (!Number.isNaN(milliseconds)) {

            const date =
                new Date(milliseconds);

            if (!Number.isNaN(date.getTime())) {
                timestamp =
                    date.toISOString();
            }
        }
    }


    return {

        timestamp,

        source: {

            name:
                extensions.dvchost ||
                deviceProduct ||
                "unknown",

            type:
                "network_device",

            vendor:
                deviceVendor || undefined
        },

        event: {

            category:
                "security",

            action:
                name || undefined,

            severity:
                severity || undefined,

            id:
                deviceEventClassId ||
                undefined
        },

        network: {

            source_ip:
                extensions.src,

            destination_ip:
                extensions.dst,

            source_port:
                toNumber(
                    extensions.spt
                ),

            destination_port:
                toNumber(
                    extensions.dpt
                ),

            protocol:
                extensions.proto
        },

        message:
            name ||
            extensions.msg ||
            undefined
    };
}