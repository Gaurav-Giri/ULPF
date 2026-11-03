import { pluginRegistry } from "./pluginRegistry.js";

/**
 * Parser Runner Abstraction
 * Decouples the processing pipeline from parser retrieval and execution.
 */
export class ParserRunner {
    constructor(registry = pluginRegistry) {
        this.registry = registry;
    }

    /**
     * Execute a parser for a given format or plugin descriptor.
     * @param {string|Object} formatOrPlugin - Format name string or plugin object
     * @param {string} payload - Raw event payload string
     * @returns {Promise<Object>} Parsed event object
     */
    async run(formatOrPlugin, payload) {
        if (!payload || typeof payload !== "string") {
            throw new Error("Payload must be a non-empty string");
        }

        let plugin;
        let parseFn;

        if (typeof formatOrPlugin === "string") {
            const format = formatOrPlugin.toLowerCase();
            plugin = this.registry.getByFormat(format);

            if (!plugin) {
                throw new Error(`No active parser plugin registered for format: ${format}`);
            }

            parseFn = plugin.parser?.parse;
        } else if (typeof formatOrPlugin === "object" && formatOrPlugin !== null) {
            plugin = formatOrPlugin;
            parseFn = plugin.parser?.parse || plugin.parse;
        }

        if (typeof parseFn !== "function") {
            throw new Error(
                `Invalid parser plugin: "parse" function is missing or not executable`
            );
        }

        try {
            const parsed = await parseFn(payload);

            if (!parsed || typeof parsed !== "object") {
                throw new Error("Parser output must be a non-empty object");
            }

            return parsed;
        } catch (err) {
            throw new Error(
                `Parser execution failed for [${plugin?.id || "unknown"}]: ${err.message}`
            );
        }
    }
}

export const parserRunner = new ParserRunner();
export default parserRunner;
