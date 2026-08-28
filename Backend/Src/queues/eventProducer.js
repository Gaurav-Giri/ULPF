import {
    getRabbitMQChannel,
    EXCHANGE,
    ROUTING_KEY
} from "../config/rabbitmq.js";

export function publishEvent(event) {
    const channel = getRabbitMQChannel();

    const message = Buffer.from(
        JSON.stringify(event)
    );

    const published = channel.publish(
        EXCHANGE,
        ROUTING_KEY,
        message,
        {
            persistent: true,
            contentType: "application/json"
        }
    );

    if (!published) {
        throw new Error(
            "RabbitMQ write buffer is full"
        );
    }

    return true;
}