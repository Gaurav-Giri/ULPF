// import {
//     opensearchClient,
//     ULPF_INDEX
// } from "../config/opensearch.js";

// export async function searchEvents({
//     query,
//     source,
//     category,
//     severity,
//     from,
//     to,
//     page = 1,
//     limit = 20
// }) {
//     const must = [];
//     const filter = [];

//     /*
//      * Full-text search
//      */
//     if (query) {
//         must.push({
//             multi_match: {
//                 query,
//                 fields: [
//                     "message",
//                     "source.name",
//                     "event.action",
//                     "event.category"
//                 ]
//             }
//         });
//     }

//     /*
//      * Exact filters
//      */
//     if (source) {
//         filter.push({
//             term: {
//                 "source.name": source
//             }
//         });
//     }

//     if (category) {
//         filter.push({
//             term: {
//                 "event.category": category
//             }
//         });
//     }

//     if (severity) {
//         filter.push({
//             term: {
//                 "event.severity": severity
//             }
//         });
//     }

//     /*
//      * Time range
//      */
//     if (from || to) {
//         const range = {};

//         if (from) {
//             range.gte = from;
//         }

//         if (to) {
//             range.lte = to;
//         }

//         filter.push({
//             range: {
//                 timestamp: range
//             }
//         });
//     }

//     const pageNumber =
//         Math.max(Number(page), 1);

//     const pageSize =
//         Math.min(
//             Math.max(Number(limit), 1),
//             100
//         );

//     const fromOffset =
//         (pageNumber - 1) * pageSize;

//     const body = {
//         from: fromOffset,

//         size: pageSize,

//         query: {
//             bool: {
//                 must,
//                 filter
//             }
//         },

//         sort: [
//             {
//                 timestamp: {
//                     order: "desc"
//                 }
//             }
//         ]
//     };

//     const response =
//         await opensearchClient.search({
//             index: ULPF_INDEX,
//             body
//         });

//     const hits =
//         response.body.hits.hits;

//     const total =
//         response.body.hits.total.value;

//     return {
//         page: pageNumber,

//         limit: pageSize,

//         total,

//         total_pages:
//             Math.ceil(total / pageSize),

//         events: hits.map(
//             hit => hit._source
//         )
//     };
// }

// export async function getEventById(eventId) {
//     const response = await opensearchClient.get({
//         index: ULPF_INDEX,
//         id: eventId
//     });

//     return response.body._source;
// }



import {
    opensearchClient,
    ULPF_INDEX
} from "../config/opensearch.js";

export async function searchEvents({
    query,
    source,
    format,
    category,
    severity,
    from,
    to,
    page = 1,
    limit = 20
}) {
    const must = [];
    const filter = [];

    /*
     * Full-text search
     */
    if (query) {
        must.push({
            multi_match: {
                query,
                fields: [
                    "message",
                    "source.name",
                    "event.action",
                    "event.category"
                ]
            }
        });
    }

    /*
     * Exact filters
     */
    if (source) {
        filter.push({
            term: {
                "source.name": source
            }
        });
    }

    if (format) {
        filter.push({
            term: {
                "raw.format": format.toLowerCase()
            }
        });
    }

    if (category) {
        filter.push({
            term: {
                "event.category": category
            }
        });
    }

    if (severity) {
        filter.push({
            term: {
                "event.severity": severity
            }
        });
    }

    /*
     * Time range
     */
    if (from || to) {
        const range = {};

        if (from) {
            range.gte = from;
        }

        if (to) {
            range.lte = to;
        }

        filter.push({
            range: {
                timestamp: range
            }
        });
    }

    /*
     * Pagination
     */
    const pageNumber =
        Math.max(Number(page) || 1, 1);

    const pageSize =
        Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

    const fromOffset =
        (pageNumber - 1) * pageSize;

    /*
     * OpenSearch query
     */
    const body = {
        from: fromOffset,

        size: pageSize,

        query: {
            bool: {
                must,
                filter
            }
        },

        sort: [
            {
                timestamp: {
                    order: "desc"
                }
            }
        ]
    };

    const response =
        await opensearchClient.search({
            index: ULPF_INDEX,
            body
        });

    const hits =
        response.body.hits.hits;

    const total =
        response.body.hits.total.value;

    return {
        page: pageNumber,

        limit: pageSize,

        total,

        total_pages:
            Math.ceil(total / pageSize),

        events: hits.map(
            hit => hit._source
        )
    };
}

export async function getEventById(eventId) {
    const response =
        await opensearchClient.get({
            index: ULPF_INDEX,
            id: eventId
        });

    return response.body._source;
}