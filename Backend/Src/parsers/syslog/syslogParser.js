export function parseSyslog(payload) {
    if (!payload || typeof payload !== "string") {
        throw new Error("Invalid Syslog payload");
    }

    const trimmed = payload.trim();
    let priority, timestampStr, hostname, message;

    // RFC 5424 Syslog: <PRI>VERSION TIMESTAMP HOSTNAME ...
    const rfc5424Match = trimmed.match(
        /^<(\d+)>\d+\s+(\d{4}-\d{2}-\d{2}T[^\s]+)\s+(\S+)\s+(.*)$/
    );

    // RFC 3164 Syslog: <PRI>MMM DD HH:MM:SS HOSTNAME MESSAGE
    const rfc3164Match = trimmed.match(
        /^<(\d+)>([A-Za-z]{3}\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(.*)$/
    );

    let isRfc5424 = false;

    if (rfc5424Match) {
        [, priority, timestampStr, hostname, message] = rfc5424Match;
        isRfc5424 = true;
    } else if (rfc3164Match) {
        [, priority, timestampStr, hostname, message] = rfc3164Match;
    } else {
        throw new Error("Invalid Syslog format");
    }

    const priorityNumber = Number(priority);
    const severityNumber = priorityNumber % 8;

    const severityMap = {
        0: "emergency",
        1: "alert",
        2: "critical",
        3: "error",
        4: "warning",
        5: "notice",
        6: "info",
        7: "debug"
    };

    const severity = severityMap[severityNumber] || "unknown";

    let timestamp;
    if (isRfc5424) {
        const parsedDate = new Date(timestampStr);
        timestamp = !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toISOString()
            : new Date().toISOString();
    } else {
        const currentYear = new Date().getUTCFullYear();
        const parsedDate = new Date(`${currentYear} ${timestampStr} UTC`);
        timestamp = !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toISOString()
            : new Date().toISOString();
    }

    const actionMatch = message.match(/\b(BLOCK|ALLOW|DENY|DROP|ACCEPT)\b/i);
    const sourceIpMatch = message.match(/\bsrc(?:_ip)?=([0-9a-fA-F:.]+)\b/i);
    const destinationIpMatch = message.match(/\bdst(?:_ip)?=([0-9a-fA-F:.]+)\b/i);
    const portMatch = message.match(/\bport=(\d+)\b/i);

    return {
        timestamp,

        source: {
            name: hostname || "unknown",
            type: "network_device"
        },

        event: {
            category: "network",
            action: actionMatch ? actionMatch[1].toUpperCase() : undefined,
            severity
        },

        network: {
            source_ip: sourceIpMatch?.[1],
            destination_ip: destinationIpMatch?.[1],
            destination_port: portMatch ? Number(portMatch[1]) : undefined
        },

        message
    };
}