// import { randomUUID } from "crypto";

// import { getParser } from "../parsers/parserRegistry.js";
// import { normalizeEvent } from "../normalizers/eventNoramlizer.js";
// import { UniversalEventSchema } from "../schemas/universalEvent.js";

// export async function processEvent(event) {
//     const {
//         source,
//         format,
//         payload,
//         received_at
//     } = event;

//     if (!source || !format || !payload) {
//         throw new Error(
//             "Event must contain source, format and payload"
//         );
//     }

//     const parser = getParser(format);

//     const parsedEvent = parser(payload);

//     const normalizedEvent =
//         normalizeEvent({
//             eventId: randomUUID(),
//             receivedAt:
//                 received_at ||
//                 new Date().toISOString(),
//             source: parsedEvent,
//             format,
//             payload
//         });

//     const validation =
//         UniversalEventSchema.safeParse(
//             normalizedEvent
//         );

//     if (!validation.success) {
//         console.error(
//             validation.error.issues
//         );

//         throw new Error(
//             "Normalized event failed schema validation"
//         );
//     }

//     return validation.data;
// }










import { randomUUID } from "crypto";

import {
    detectFormat
} from "../detectors/formatDetector.js";

import {
    getParser
} from "../parsers/registry/parserRegistry.js";

import {
    normalizeEvent
} from "../normalizers/eventNormalizer.js";

import {
    UniversalEventSchema
} from "../schemas/universalEvent.js";

import {
    storeRawEvent
} from "./rawEventStorage.js";

import {
    storeNormalizedEvent
} from "./eventSearchStorage.js";


export async function processEvent(event) {

    const {
        source,
        format: suppliedFormat,
        payload,
        received_at
    } = event;


    if (!source || !payload) {
        throw new Error(
            "Event must contain source and payload"
        );
    }


    /*
     * Determine format
     */

    let format = suppliedFormat;

    let detection = null;

    if (!format) {

        detection =
            detectFormat(payload);

        format =
            detection.format;
    }


    if (!format || format === "unknown") {

        throw new Error(
            "Unable to determine event format"
        );
    }


    /*
     * Format detection metadata
     */

    const formatDetection = {

        format,

        confidence:
            detection?.confidence ?? 1,

        method:
            suppliedFormat
                ? "explicit"
                : "automatic"
    };


    /*
     * Generate event ID
     */

    const eventId =
        randomUUID();


    /*
     * Preserve raw event
     */

    const rawEvent = {

        event_id: eventId,

        source,

        format,

        payload,

        received_at:
            received_at ||
            new Date().toISOString()
    };


    const rawStorage =
        await storeRawEvent(
            rawEvent
        );


    /*
     * Find parser
     */

    const parser =
        getParser(format);


    if (!parser) {

        throw new Error(
            `No parser registered for format: ${format}`
        );
    }


    /*
     * Parse
     */

    const parsedEvent =
        parser(payload);


    /*
     * Normalize
     */

    const normalizedEvent =
        normalizeEvent({

            eventId,

            receivedAt:
                rawEvent.received_at,

            source:
                parsedEvent,

            format,

            payload,

            sha256:
                rawStorage.sha256

        });


    /*
     * Validate
     */

    const validation =
        UniversalEventSchema.safeParse(
            normalizedEvent
        );


    if (!validation.success) {

        console.error(
            validation.error.issues
        );

        throw new Error(
            "Normalized event failed schema validation"
        );
    }


    const validatedEvent =
        validation.data;


    /*
     * Store normalized event
     */

    const searchStorage =
        await storeNormalizedEvent(
            validatedEvent,
            rawStorage
        );


    return {

        normalized:
            validatedEvent,

        rawStorage,

        searchStorage,

        formatDetection

    };
}