// import {
//     getRabbitMQChannel,
//     QUEUE
// } from "../config/rabbitmq.js";

// export async function startEventWorker() {
//     const channel = getRabbitMQChannel();

//     await channel.prefetch(10);

//     await channel.consume(
//         QUEUE,
//         async (message) => {
//             if (!message) {
//                 return;
//             }

//             try {
//                 const event = JSON.parse(
//                     message.content.toString()
//                 );

//                 console.log(
//                     "\n========== ULPF EVENT =========="
//                 );

//                 console.log(
//                     JSON.stringify(event, null, 2)
//                 );

//                 console.log(
//                     "================================\n"
//                 );

//                 channel.ack(message);
//             } catch (error) {
//                 console.error(
//                     "Event processing failed:",
//                     error.message
//                 );

//                 channel.nack(
//                     message,
//                     false,
//                     false
//                 );
//             }
//         }
//     );

//     console.log(
//         `ULPF Worker listening on queue: ${QUEUE}`
//     );
// }






import {
    getRabbitMQChannel,
    QUEUE
} from "../config/rabbitmq.js";

import {
    processEvent
} from "../services/eventProcessor.js";

export async function startEventWorker() {
    const channel = getRabbitMQChannel();

    await channel.prefetch(10);

    await channel.consume(
        QUEUE,
        async (message) => {
            if (!message) {
                return;
            }

            try {
                const event =
                    JSON.parse(
                        message.content.toString()
                    );

                console.log(
                    "\n========== RAW EVENT =========="
                );

                console.log(
                    JSON.stringify(
                        event,
                        null,
                        2
                    )
                );

                // const normalized =
                //     await processEvent(event);
                const result =
                    await processEvent(event);

                const normalized = result.normalized;
                const rawStorage = result.rawStorage;   

                console.log(
                    "\n======= NORMALIZED EVENT ======="
                );

                console.log(
                    JSON.stringify(
                        normalized,
                        null,
                        2
                    )
                );

                console.log(
                    "\n======= RAW STORAGE ======="
                );

                console.log(
                    JSON.stringify(
                        rawStorage,
                        null,
                        2
                    )
                );
                console.log(
                    "================================\n"
                );

                channel.ack(message);

            } catch (error) {

                console.error(
                    "Event processing failed:",
                    error.message
                );

                channel.nack(
                    message,
                    false,
                    false
                );
            }
        }
    );

    console.log(
        `ULPF Worker listening on queue: ${QUEUE}`
    );
}