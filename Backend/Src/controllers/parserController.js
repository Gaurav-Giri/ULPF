import { pluginManager } from "../core/plugins/pluginManager.js";
import { pluginRegistry } from "../core/plugins/pluginRegistry.js";
import { parserRunner } from "../core/plugins/parserRunner.js";

/**
 * Controller to expose installed parser plugins.
 */
export async function getInstalledParsers(req, res) {
    try {
        const parsers = pluginManager.listPlugins();
        return res.status(200).json({
            success: true,
            parsers
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to list parser plugins: " + err.message
        });
    }
}

/**
 * Controller to retrieve a single parser plugin by ID.
 */
export async function getParserById(req, res) {
    try {
        const { id } = req.params;
        const plugin = pluginRegistry.get(id);

        if (!plugin) {
            return res.status(404).json({
                success: false,
                message: `Parser plugin '${id}' not found`
            });
        }

        const parser = {
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            description: plugin.description || "",
            type: plugin.type,
            apiVersion: plugin.apiVersion,
            formats: plugin.formats,
            enabled: plugin.enabled
        };

        return res.status(200).json({
            success: true,
            parser
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve parser plugin: " + err.message
        });
    }
}

/**
 * Controller to reload all parser plugins from disk.
 */
export async function reloadParserPlugins(req, res) {
    try {
        const summary = await pluginManager.reloadPlugins();
        const parsers = pluginManager.listPlugins();

        return res.status(200).json({
            success: true,
            message: "Parser plugins reloaded successfully",
            summary,
            parsers
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to reload parser plugins: " + err.message
        });
    }
}

/**
 * Controller to dry-run / test a parser plugin with a sample payload.
 * Does NOT publish to RabbitMQ or write to MinIO/OpenSearch.
 */
export async function testParserPlugin(req, res) {
    try {
        const { id } = req.params;
        const plugin = pluginRegistry.get(id);

        if (!plugin) {
            return res.status(404).json({
                success: false,
                message: `Parser plugin '${id}' not found`
            });
        }

        if (!plugin.enabled) {
            return res.status(400).json({
                success: false,
                message: `Parser plugin '${id}' is currently disabled`
            });
        }

        if (!req.body || typeof req.body !== "object" || typeof req.body.payload !== "string" || !req.body.payload.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid request. Body must contain a non-empty string 'payload' field."
            });
        }

        const parsed = await parserRunner.run(plugin, req.body.payload);

        return res.status(200).json({
            success: true,
            parser_id: plugin.id,
            data: parsed
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
}
