import amqp from "amqplib";
import { env } from "./env.js";

const EXCHANGE = "ulpf.events";
const QUEUE = env.rabbitmq.queue;
const ROUTING_KEY = "event.ingest";

let connection = null;
let channel = null;

export async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(env.rabbitmq.url);

        connection.on("error", (error) => {
            console.error("RabbitMQ connection error:", error.message);
        });

        connection.on("close", () => {
            console.error("RabbitMQ connection closed");
            connection = null;
            channel = null;
        });

        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE, "direct", {
            durable: true
        });

        await channel.assertQueue(QUEUE, {
            durable: true
        });

        await channel.bindQueue(
            QUEUE,
            EXCHANGE,
            ROUTING_KEY
        );

        console.log("RabbitMQ connected");
        console.log(`Exchange: ${EXCHANGE}`);
        console.log(`Queue: ${QUEUE}`);

        return channel;
    } catch (error) {
        console.error(
            "Failed to connect to RabbitMQ:",
            error.message
        );

        throw error;
    }
}

export function getRabbitMQChannel() {
    if (!channel) {
        throw new Error("RabbitMQ channel is not initialized");
    }

    return channel;
}

export {
    EXCHANGE,
    QUEUE,
    ROUTING_KEY
};