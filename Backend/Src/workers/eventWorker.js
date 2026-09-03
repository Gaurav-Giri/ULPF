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
                const event = JSON.parse(
                    message.content.toString()
                );

                const result = await processEvent(event);

                console.log(
                    `[Worker] Event processed successfully | ID: ${result.normalized.event_id} | Format: ${result.formatDetection.format}`
                );

                channel.ack(message);

            } catch (error) {

                console.error(
                    "[Worker] Event processing failed:",
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