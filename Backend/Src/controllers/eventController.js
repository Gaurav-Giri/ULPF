import {
    searchEvents,
    getEventById as findEventById
} from "../services/eventSearchService.js";

export async function getEvents(req, res) {
    try {
        const {
            query,
            source,
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