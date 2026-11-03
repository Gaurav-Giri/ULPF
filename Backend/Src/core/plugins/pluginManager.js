import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PluginLoader } from "./pluginLoader.js";
import { pluginRegistry } from "./pluginRegistry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default plugins directory: Backend/plugins/parsers
const DEFAULT_PLUGINS_DIR = path.resolve(__dirname, "../../../plugins/parsers");

export class PluginManager {
    constructor(pluginsDir = DEFAULT_PLUGINS_DIR) {
        this.pluginsDir = pluginsDir;
    }

    /**
     * Discovers, validates, and loads all parser plugins in the designated plugins directory.
     * @param {string} [customDir]
     */
    async loadPlugins(customDir) {
        const targetDir = customDir || this.pluginsDir;
        let entries = [];

        try {
            entries = await fs.readdir(targetDir, { withFileTypes: true });
        } catch (err) {
            console.warn(`[PluginManager] Plugins directory not found or inaccessible: ${targetDir}`);
            return { loaded: 0, disabled: 0, failed: 0 };
        }

        const pluginDirs = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        console.log(`[PluginManager] Discovering parser plugins in: ${targetDir}`);

        let loadedCount = 0;
        let disabledCount = 0;
        let failedCount = 0;

        for (const dirName of pluginDirs) {
            const pluginPath = path.join(targetDir, dirName);

            try {
                const plugin = await PluginLoader.loadPlugin(pluginPath);
                pluginRegistry.register(plugin);

                if (plugin.enabled) {
                    console.log(`  ✓ ${plugin.name.padEnd(22)} v${plugin.version}`);
                    loadedCount++;
                } else {
                    console.log(`  ○ ${plugin.name.padEnd(22)} v${plugin.version} (disabled)`);
                    disabledCount++;
                }
            } catch (err) {
                console.error(`  ✗ Failed to load parser plugin: ${dirName}`);
                console.error(`    Reason: ${err.message}`);
                failedCount++;
            }
        }

        console.log(`[PluginManager] Parser plugins loaded: ${loadedCount}`);
        if (disabledCount > 0) {
            console.log(`[PluginManager] Parser plugins disabled: ${disabledCount}`);
        }
        if (failedCount > 0) {
            console.log(`[PluginManager] Parser plugins failed: ${failedCount}`);
        }

        return {
            loaded: loadedCount,
            disabled: disabledCount,
            failed: failedCount
        };
    }

    /**
     * Reload all plugins.
     * @param {string} [customDir]
     */
    async reloadPlugins(customDir) {
        pluginRegistry.clear();
        return this.loadPlugins(customDir);
    }

    /**
     * Return public metadata for all installed parser plugins.
     */
    listPlugins() {
        return pluginRegistry.getAll().map((p) => ({
            id: p.id,
            name: p.name,
            version: p.version,
            description: p.description,
            type: p.type,
            apiVersion: p.apiVersion,
            formats: p.formats,
            enabled: p.enabled
        }));
    }
}

export const pluginManager = new PluginManager();
export default pluginManager;
