// import { minioClient, RAW_BUCKET } from "../config/minio.js";
// import crypto from "crypto";
// export async function storeRawEvent(event) {
//     const date = new Date(event.received_at);

//     const year = date.getUTCFullYear();
//     const month = String(
//         date.getUTCMonth() + 1
//     ).padStart(2, "0");

//     const day = String(
//         date.getUTCDate()
//     ).padStart(2, "0");

//     const objectName =
//         `${year}/${month}/${day}/${event.event_id}.json`;

//     const content = JSON.stringify(
//         event,
//         null,
//         2
//     );

//     const buffer = Buffer.from(content);

//     await minioClient.putObject(
//         RAW_BUCKET,
//         objectName,
//         buffer,
//         buffer.length,
//         {
//             "Content-Type": "application/json"
//         }
//     );

//     return {
//         bucket: RAW_BUCKET,
//         object: objectName
//     };
// }


// // export async function getRawEvent({
// //     bucket,
// //     object
// // }) {
// //     const stream = await minioClient.getObject(
// //         bucket,
// //         object
// //     );

// //     const chunks = [];

// //     for await (const chunk of stream) {
// //         chunks.push(chunk);
// //     }

// //     return Buffer.concat(chunks);
// // }



// export async function getRawEvent({
//     bucket,
//     object
// }) {
//     const stream = await minioClient.getObject(
//         bucket,
//         object
//     );

//     const chunks = [];

//     for await (const chunk of stream) {
//         chunks.push(chunk);
//     }

//     const buffer = Buffer.concat(chunks);

//     const sha256 = crypto
//         .createHash("sha256")
//         .update(buffer)
//         .digest("hex");

//     return {
//         buffer,
//         sha256
//     };
// }






import { minioClient, RAW_BUCKET } from "../config/minio.js";
import crypto from "crypto";


function calculatePayloadHash(payload) {
    return crypto
        .createHash("sha256")
        .update(
            Buffer.from(payload, "utf-8")
        )
        .digest("hex");
}


export async function storeRawEvent(event) {

    const date =
        new Date(event.received_at);

    const year =
        date.getUTCFullYear();

    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getUTCDate()
        ).padStart(2, "0");


    const objectName =
        `${year}/${month}/${day}/${event.event_id}.json`;


    /*
     * Calculate hash of the ORIGINAL payload.
     *
     * This is the integrity hash used by
     * the normalized event.
     */
    const sha256 =
        calculatePayloadHash(
            event.payload
        );


    /*
     * Store the complete raw event.
     */
    const content =
        JSON.stringify(
            event,
            null,
            2
        );


    const buffer =
        Buffer.from(
            content,
            "utf-8"
        );


    await minioClient.putObject(
        RAW_BUCKET,
        objectName,
        buffer,
        buffer.length,
        {
            "Content-Type":
                "application/json"
        }
    );


    return {
        bucket: RAW_BUCKET,
        object: objectName,
        sha256
    };
}


export async function getRawEvent({
    bucket,
    object
}) {

    const stream =
        await minioClient.getObject(
            bucket,
            object
        );


    const chunks = [];


    for await (const chunk of stream) {
        chunks.push(chunk);
    }


    const buffer =
        Buffer.concat(chunks);


    /*
     * Parse the raw event wrapper.
     */
    const rawEvent =
        JSON.parse(
            buffer.toString("utf-8")
        );


    if (
        typeof rawEvent.payload !==
        "string"
    ) {
        throw new Error(
            "Raw event payload is missing or invalid"
        );
    }


    /*
     * Recalculate the hash from
     * the ORIGINAL payload.
     */
    const sha256 =
        calculatePayloadHash(
            rawEvent.payload
        );


    return {
        buffer,
        sha256
    };
}