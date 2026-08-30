export function detectFormat(payload) {
    if (!payload || typeof payload !== "string") {
        return {
            format: "unknown",
            confidence: 0
        };
    }

    const trimmed =
        payload.trim();

    /*
     * JSON
     */
    if (
        (
            trimmed.startsWith("{") &&
            trimmed.endsWith("}")
        ) ||
        (
            trimmed.startsWith("[") &&
            trimmed.endsWith("]")
        )
    ) {
        try {
            JSON.parse(trimmed);

            return {
                format: "json",
                confidence: 1
            };
        } catch {
            // Not valid JSON
        }
    }

    /*
     * CEF
     *
     * Example:
     * CEF:0|Vendor|Product|1.0|100|Login Failed|10|src=10.0.0.1
     */
    if (
        /^CEF:\d+\|/i.test(trimmed)
    ) {
        return {
            format: "cef",
            confidence: 1
        };
    }

    /*
     * LEEF
     *
     * Example:
     * LEEF:2.0|Vendor|Product|Version|EventID
     */
    if (
        /^LEEF:\d+\.\d+\|/i.test(trimmed)
    ) {
        return {
            format: "leef",
            confidence: 1
        };
    }

    /*
     * RFC 3164 Syslog
     *
     * Example:
     * <134>Aug 29 13:30:12 FW01 BLOCK ...
     */
    if (
        /^<\d+>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+/.test(
            trimmed
        )
    ) {
        return {
            format: "syslog",
            confidence: 0.95
        };
    }

    /*
     * RFC 5424 Syslog
     *
     * Example:
     * <134>1 2026-08-29T13:30:12Z FW01 ...
     */
    if (
        /^<\d+>\d+\s+\d{4}-\d{2}-\d{2}T/.test(
            trimmed
        )
    ) {
        return {
            format: "syslog",
            confidence: 0.95
        };
    }

    return {
        format: "unknown",
        confidence: 0
    };
}