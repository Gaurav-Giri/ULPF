import { Client } from "@opensearch-project/opensearch";
import { env } from "./env.js";

export const opensearchClient = new Client({
    node: env.opensearch.url,

    auth: {
        username: env.opensearch.username,
        password: env.opensearch.password
    },

    ssl: {
        rejectUnauthorized: false
    }
});

export const ULPF_INDEX = "ulpf-events";

export async function initializeOpenSearch() {
    try {
        const exists =
            await opensearchClient.indices.exists({
                index: ULPF_INDEX
            });

        if (!exists.body) {
            await opensearchClient.indices.create({
                index: ULPF_INDEX,

                body: {
                    mappings: {
                        properties: {
                            event_id: {
                                type: "keyword"
                            },

                            timestamp: {
                                type: "date"
                            },

                            received_at: {
                                type: "date"
                            },

                            source: {
                                properties: {
                                    name: {
                                        type: "keyword"
                                    },

                                    type: {
                                        type: "keyword"
                                    },

                                    vendor: {
                                        type: "keyword"
                                    }
                                }
                            },

                            event: {
                                properties: {
                                    category: {
                                        type: "keyword"
                                    },

                                    action: {
                                        type: "keyword"
                                    },

                                    severity: {
                                        type: "keyword"
                                    }
                                }
                            },

                            network: {
                                properties: {
                                    source_ip: {
                                        type: "ip"
                                    },

                                    destination_ip: {
                                        type: "ip"
                                    },

                                    source_port: {
                                        type: "integer"
                                    },

                                    destination_port: {
                                        type: "integer"
                                    },

                                    protocol: {
                                        type: "keyword"
                                    }
                                }
                            },

                            message: {
                                type: "text"
                            },

                            raw: {
                                properties: {
                                    format: {
                                        type: "keyword"
                                    },

                                    sha256: {
                                        type: "keyword"
                                    },

                                    storage: {
                                        properties: {
                                            type: {
                                                type: "keyword"
                                            },

                                            bucket: {
                                                type: "keyword"
                                            },

                                            object: {
                                                type: "keyword"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            console.log(
                `Created OpenSearch index: ${ULPF_INDEX}`
            );
        } else {
            console.log(
                `OpenSearch index exists: ${ULPF_INDEX}`
            );
        }

    } catch (error) {
        console.error(
            "OpenSearch initialization failed:",
            error.message
        );

        throw error;
    }
}