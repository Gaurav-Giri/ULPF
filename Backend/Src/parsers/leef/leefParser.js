// export function parseLeef(payload) {
//     if (!payload || typeof payload !== "string") {
//         throw new Error("Invalid LEEF payload");
//     }

//     const trimmed = payload.trim();

//     /*
//      * LEEF format:
//      *
//      * LEEF:Version|Vendor|Product|Version|EventID|Extension
//      *
//      * Example:
//      *
//      * LEEF:2.0|IBM|QRadar|7.5|1001|
//      * src=192.168.1.25	dst=10.0.0.20
//      * spt=54321	dpt=443	proto=TCP	action=BLOCK
//      */

//     if (!/^LEEF:\d+\.\d+\|/i.test(trimmed)) {
//         throw new Error("Invalid LEEF format");
//     }

//     const parts = trimmed.split("|");

//     if (parts.length < 6) {
//         throw new Error(
//             "Invalid LEEF payload: incomplete header"
//         );
//     }

//     const [
//         leefVersion,
//         vendor,
//         product,
//         productVersion,
//         eventId,
//         ...extensionParts
//     ] = parts;

//     /*
//      * Everything after the fifth pipe is the
//      * LEEF extension section.
//      */
//     const extensionText =
//         extensionParts.join("|");

//     const extensions = {};

//     /*
//      * LEEF commonly uses TAB-separated
//      * key=value pairs.
//      *
//      * We also support spaces as a fallback.
//      */

//     const extensionFields =
//         extensionText.split(/\t+/);

//     for (const field of extensionFields) {

//         const separator =
//             field.indexOf("=");

//         if (separator === -1) {
//             continue;
//         }

//         const key =
//             field.slice(0, separator).trim();

//         const value =
//             field.slice(separator + 1).trim();

//         if (!key) {
//             continue;
//         }

//         extensions[key] = value;
//     }

//     /*
//      * Fallback for LEEF strings where
//      * extensions are separated by spaces.
//      *
//      * Example:
//      * src=10.0.0.1 dst=10.0.0.2
//      */

//     if (
//         Object.keys(extensions).length === 0
//     ) {

//         const regex =
//             /(\w+)=("[^"]*"|\S+)/g;

//         let match;

//         while (
//             (match = regex.exec(extensionText))
//             !== null
//         ) {

//             let value =
//                 match[2];

//             if (
//                 value.startsWith('"') &&
//                 value.endsWith('"')
//             ) {
//                 value =
//                     value.slice(1, -1);
//             }

//             extensions[match[1]] =
//                 value;
//         }
//     }

//     /*
//      * Convert numeric values.
//      */

//     const toNumber = (value) => {

//         if (
//             value === undefined ||
//             value === null ||
//             value === ""
//         ) {
//             return undefined;
//         }

//         const number =
//             Number(value);

//         return Number.isNaN(number)
//             ? undefined
//             : number;
//     };


//     /*
//      * LEEF timestamp handling.
//      *
//      * devTime / eventTime may be supplied
//      * depending on the source.
//      */

//     let timestamp =
//         new Date().toISOString();

//     const timeValue =
//         extensions.devTime ||
//         extensions.eventTime ||
//         extensions.rt;

//     if (timeValue) {

//         const milliseconds =
//             Number(timeValue);

//         if (!Number.isNaN(milliseconds)) {

//             const date =
//                 new Date(milliseconds);

//             if (!Number.isNaN(date.getTime())) {
//                 timestamp =
//                     date.toISOString();
//             }
//         }
//     }


//     return {

//         timestamp,

//         source: {

//             name:
//                 extensions.devName ||
//                 product ||
//                 "unknown",

//             type:
//                 "network_device",

//             vendor:
//                 vendor || undefined
//         },

//         event: {

//             category:
//                 "security",

//             action:
//                 extensions.action ||
//                 extensions.eventName ||
//                 "unknown",

//             severity:
//                 extensions.severity ||
//                 undefined,

//             id:
//                 eventId ||
//                 undefined
//         },

//         network: {

//             source_ip:
//                 extensions.src,

//             destination_ip:
//                 extensions.dst,

//             source_port:
//                 toNumber(
//                     extensions.spt
//                 ),

//             destination_port:
//                 toNumber(
//                     extensions.dpt
//                 ),

//             protocol:
//                 extensions.proto
//         },

//         message:
//             extensions.msg ||
//             extensions.eventName ||
//             extensions.action ||
//             undefined
//     };
// }







export function parseLeef(payload) {
    if (!payload || typeof payload !== "string") {
        throw new Error("Invalid LEEF payload");
    }

    const trimmed = payload.trim();

    /*
     * LEEF format:
     *
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

    /*
     * Everything after the fifth pipe is the
     * LEEF extension section.
     */
    const extensionText =
        extensionParts.join("|").trim();

    const extensions = {};


    /*
     * Parse key=value fields.
     *
     * LEEF normally uses TAB separators.
     *
     * We also support whitespace-separated
     * fields:
     *
     * src=10.0.0.1 dst=10.0.0.2
     *
     * Values can contain spaces, so we stop
     * a value only when another key=value
     * pair begins.
     */
    const regex =
        /(?:^|\t|\s)([A-Za-z0-9_.-]+)=("[^"]*"|'[^']*'|.*?)(?=\s+[A-Za-z0-9_.-]+=|$)/g;

    let match;

    while (
        (match = regex.exec(extensionText)) !== null
    ) {
        const key =
            match[1].trim();

        let value =
            match[2].trim();

        /*
         * Remove surrounding quotes.
         */
        if (
            value.length >= 2 &&
            (
                (
                    value.startsWith('"') &&
                    value.endsWith('"')
                ) ||
                (
                    value.startsWith("'") &&
                    value.endsWith("'")
                )
            )
        ) {
            value =
                value.slice(1, -1);
        }

        if (key) {
            extensions[key] = value;
        }
    }


    /*
     * Convert numeric values.
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
     * LEEF timestamp handling.
     */
    let timestamp =
        new Date().toISOString();

    const timeValue =
        extensions.devTime ||
        extensions.eventTime ||
        extensions.rt;

    if (timeValue) {

        const milliseconds =
            Number(timeValue);

        if (!Number.isNaN(milliseconds)) {

            const date =
                new Date(milliseconds);

            if (!Number.isNaN(date.getTime())) {
                timestamp =
                    date.toISOString();
            }
        }
    }


    /*
     * Build normalized parser output.
     */
    return {

        timestamp,

        source: {

            name:
                extensions.devName ||
                product ||
                "unknown",

            type:
                "network_device",

            vendor:
                vendor || undefined
        },

        event: {

            category:
                "security",

            action:
                extensions.action ||
                extensions.eventName ||
                "unknown",

            severity:
                extensions.severity ||
                undefined,

            id:
                eventId ||
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
            extensions.msg ||
            extensions.eventName ||
            extensions.action ||
            undefined
    };
}
