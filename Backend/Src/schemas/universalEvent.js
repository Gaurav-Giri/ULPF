import { z } from "zod";

export const UniversalEventSchema = z.object({
    event_id: z.string(),

    timestamp: z.string(),

    received_at: z.string(),

    source: z.object({
        name: z.string(),
        type: z.string(),
        vendor: z.string().optional()
    }),

    event: z.object({
        category: z.string(),
        action: z.string().optional(),
        severity: z.string().optional()
    }),

    network: z.object({
        source_ip: z.string().optional(),
        destination_ip: z.string().optional(),
        source_port: z.number().optional(),
        destination_port: z.number().optional(),
        protocol: z.string().optional()
    }),

    message: z.string().optional(),

    metadata: z.record(z.string(), z.any()).optional(),

    raw: z.object({
        format: z.string(),
        // payload: z.string(),
        sha256: z.string()
    })
});