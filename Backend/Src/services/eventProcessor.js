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

import { getParser } from "../parsers/parserRegistry.js";

import {
    normalizeEvent
} from "../normalizers/eventNoramlizer.js";

import {
    UniversalEventSchema
} from "../schemas/universalEvent.js";

import {
    storeRawEvent
} from "./rawEventStorage.js";

export async function processEvent(event) {
    const {
        source,
        format,
        payload,
        received_at
    } = event;

    if (!source || !format || !payload) {
        throw new Error(
            "Event must contain source, format and payload"
        );
    }

    const eventId = randomUUID();

    const rawEvent = {
        event_id: eventId,
        source,
        format,
        payload,
        received_at:
            received_at ||
            new Date().toISOString()
    };

    /*
     * Store the original event BEFORE parsing.
     *
     * This ensures that even if a parser later
     * changes, the original evidence remains intact.
     */
    const rawStorage =
        await storeRawEvent(rawEvent);

    const parser = getParser(format);

    const parsedEvent = parser(payload);

    const normalizedEvent =
        normalizeEvent({
            eventId,
            receivedAt: rawEvent.received_at,
            source: parsedEvent,
            format,
            payload
        });

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

    return {
        normalized: validation.data,
        rawStorage
    };
}