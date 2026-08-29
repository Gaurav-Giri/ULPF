// export function parseSyslog(payload) {
//     const match = payload.match(
//         /^<(\d+)>([A-Za-z]{3}\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(.*)$/
//     );

//     if (!match) {
//         throw new Error("Invalid Syslog format");
//     }

//     const [
//         ,
//         priority,
//         timestamp,
//         hostname,
//         message
//     ] = match;

//     const priorityNumber = Number(priority);

//     const severityNumber =
//         priorityNumber % 8;

//     const severityMap = {
//         0: "emergency",
//         1: "alert",
//         2: "critical",
//         3: "error",
//         4: "warning",
//         5: "notice",
//         6: "info",
//         7: "debug"
//     };

//     const severity =
//         severityMap[severityNumber] || "unknown";

//     const actionMatch =
//         message.match(/\b(BLOCK|ALLOW|DENY|DROP|ACCEPT)\b/i);

//     const sourceIpMatch =
//         message.match(
//             /\bsrc(?:_ip)?=([0-9a-fA-F:.]+)\b/i
//         );

//     const destinationIpMatch =
//         message.match(
//             /\bdst(?:_ip)?=([0-9a-fA-F:.]+)\b/i
//         );

//     const portMatch =
//         message.match(
//             /\bport=(\d+)\b/i
//         );

//     return {
//         timestamp,

//         source: {
//             name: hostname,
//             type: "network_device"
//         },

//         event: {
//             category: "network",
//             action: actionMatch
//                 ? actionMatch[1].toUpperCase()
//                 : undefined,
//             severity
//         },

//         network: {
//             source_ip: sourceIpMatch?.[1],
//             destination_ip:
//                 destinationIpMatch?.[1],
//             destination_port:
//                 portMatch
//                     ? Number(portMatch[1])
//                     : undefined
//         },

//         message
//     };
// }










export function parseSyslog(payload) {
    const match = payload.match(
        /^<(\d+)>([A-Za-z]{3}\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(.*)$/
    );

    if (!match) {
        throw new Error("Invalid Syslog format");
    }

    const [
        ,
        priority,
        syslogTimestamp,
        hostname,
        message
    ] = match;

    const priorityNumber = Number(priority);

    const severityNumber =
        priorityNumber % 8;

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

    const severity =
        severityMap[severityNumber] || "unknown";

    /*
     * RFC 3164 Syslog timestamps don't contain
     * a year. We therefore infer the current year.
     */
    const currentYear =
        new Date().getUTCFullYear();

    const timestamp =
        new Date(
            `${currentYear} ${syslogTimestamp} UTC`
        ).toISOString();

    const actionMatch =
        message.match(
            /\b(BLOCK|ALLOW|DENY|DROP|ACCEPT)\b/i
        );

    const sourceIpMatch =
        message.match(
            /\bsrc(?:_ip)?=([0-9a-fA-F:.]+)\b/i
        );

    const destinationIpMatch =
        message.match(
            /\bdst(?:_ip)?=([0-9a-fA-F:.]+)\b/i
        );

    const portMatch =
        message.match(
            /\bport=(\d+)\b/i
        );

    return {
        timestamp,

        source: {
            name: hostname,
            type: "network_device"
        },

        event: {
            category: "network",

            action: actionMatch
                ? actionMatch[1].toUpperCase()
                : undefined,

            severity
        },

        network: {
            source_ip:
                sourceIpMatch?.[1],

            destination_ip:
                destinationIpMatch?.[1],

            destination_port:
                portMatch
                    ? Number(portMatch[1])
                    : undefined
        },

        message
    };
}