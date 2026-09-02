import {
    searchEvents,
    getEventById as findEventById
} from "../services/eventSearchService.js";
import {
    getRawEvent
} from "../services/rawEventStorage.js";
export async function getEvents(req, res) {
    try {
        const {
            query,
            source,
            format,
            category,
            severity,
            from,
            to,
            page,
            limit
        } = req.query;

        const result =
            await searchEvents({
                query,
                source,
                format,
                category,
                severity,
                from,
                to,
                page,
                limit
            });

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(
            "Event search failed:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to search events"
        });
    }
}


export async function getEventById(req, res) {
    try {
        const { eventId } = req.params;

        const event = await findEventById(eventId);

        res.status(200).json({
            success: true,
            data: event
        });

    } catch (error) {

        if (error.meta?.statusCode === 404) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        console.error(
            "Event retrieval failed:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve event"
        });
    }
}

export async function getRawEventById(req, res) {
    try {
        const { eventId } = req.params;

        const event = await findEventById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const storage =
            event.raw?.storage;

        if (!storage) {
            return res.status(404).json({
                success: false,
                message: "Raw event storage reference not found"
            });
        }

        const {
            buffer: rawData,
            sha256: calculatedSha256
        } = await getRawEvent({
            bucket: storage.bucket,
            object: storage.object
        });

        res.status(200).json({
            success: true,
            data: {
                event_id: event.event_id,

                bucket: storage.bucket,

                object: storage.object,

                sha256: {
                    stored: event.raw.sha256,
                    calculated: calculatedSha256,
                    verified:
                        event.raw.sha256 === calculatedSha256
                },

                raw_event: JSON.parse(
                    rawData.toString("utf-8")
                )
            }
        });

    } catch (error) {

        console.error(
            "Raw event retrieval failed:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve raw event"
        });
    }
}