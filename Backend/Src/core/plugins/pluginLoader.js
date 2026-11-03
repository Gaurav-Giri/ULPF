import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

export const SUPPORTED_API_VERSION = "1.0";
const SUPPORTED_MAJOR_VERSION = "1";

/**
 * Validates and loads a single parser plugin from its directory.
 */
export class PluginLoader {
    /**
     * Load a plugin from a directory path.
     * @param {string} pluginDir - Absolute path to plugin directory
     * @returns {Promise<Object>} Loaded plugin descriptor
     */
    static async loadPlugin(pluginDir) {
        // 1. Check directory exists
        let stats;
        try {
            stats = await fs.stat(pluginDir);
        } catch {
            throw new Error(`Plugin directory does not exist: ${pluginDir}`);
        }

        if (!stats.isDirectory()) {
            throw new Error(`Plugin path is not a directory: ${pluginDir}`);
        }

        // 2. Check manifest.json exists
        const manifestPath = path.join(pluginDir, "manifest.json");
        try {
            await fs.access(manifestPath);
        } catch {
            throw new Error(`Missing manifest.json in ${pluginDir}`);
        }

        // 3. Parse manifest JSON
        let manifest;
        try {
            const raw = await fs.readFile(manifestPath, "utf-8");
            manifest = JSON.parse(raw);
        } catch (err) {
            throw new Error(`Invalid JSON in manifest.json: ${err.message}`);
        }

        // 4. Validate required fields
        const requiredFields = ["id", "name", "version", "type", "apiVersion", "formats", "entry"];
        for (const field of requiredFields) {
            if (!manifest[field]) {
                throw new Error(`Missing required field "${field}" in manifest.json`);
            }
        }

        if (!Array.isArray(manifest.formats) || manifest.formats.length === 0) {
            throw new Error(`Field "formats" must be a non-empty array in manifest.json`);
        }

        // 5. Validate type
        if (manifest.type !== "parser") {
            throw new Error(`Unsupported plugin type "${manifest.type}". Expected "parser"`);
        }

        // 6. Validate apiVersion
        const apiVersion = String(manifest.apiVersion).trim();
        const apiMajor = apiVersion.split(".")[0];
        if (apiMajor !== SUPPORTED_MAJOR_VERSION) {
            throw new Error(
                `Incompatible apiVersion "${manifest.apiVersion}". Expected API version ${SUPPORTED_API_VERSION}`
            );
        }

        // 7 & 8. Validate entry file exists
        const entryPath = path.resolve(pluginDir, manifest.entry);
        try {
            await fs.access(entryPath);
        } catch {
            throw new Error(`Entry file does not exist: ${manifest.entry} in ${pluginDir}`);
        }

        const isEnabled = manifest.enabled !== false;

        // If disabled, we don't necessarily need to dynamically import, but we return valid descriptor
        if (!isEnabled) {
            return {
                id: manifest.id.toLowerCase(),
                name: manifest.name,
                version: manifest.version,
                description: manifest.description || "",
                type: manifest.type,
                apiVersion: manifest.apiVersion,
                formats: manifest.formats.map((f) => f.toLowerCase()),
                entry: manifest.entry,
                dir: pluginDir,
                enabled: false,
                parser: null
            };
        }

        // 9. Dynamically import entry module
        let entryModule;
        try {
            // Append timestamp cache-buster if needed or load via file URL
            const fileUrl = pathToFileURL(entryPath).href;
            entryModule = await import(fileUrl);
        } catch (err) {
            throw new Error(`Failed to dynamically import entry file: ${err.message}`);
        }

        // 10. Verify required parser interface exists
        let parseFn = null;
        let detectFn = null;

        if (typeof entryModule.parse === "function") {
            parseFn = entryModule.parse;
        } else if (entryModule.default) {
            if (typeof entryModule.default.parse === "function") {
                parseFn = entryModule.default.parse.bind(entryModule.default);
            } else if (typeof entryModule.default === "function") {
                parseFn = entryModule.default;
            }
        }

        if (!parseFn) {
            throw new Error(
                `Plugin entry point "${manifest.entry}" does not export a "parse" function`
            );
        }

        // Detect optional format detection hook
        if (typeof entryModule.detect === "function") {
            detectFn = entryModule.detect;
        } else if (entryModule.default && typeof entryModule.default.detect === "function") {
            detectFn = entryModule.default.detect.bind(entryModule.default);
        } else if (typeof entryModule.canParse === "function") {
            detectFn = entryModule.canParse;
        } else if (entryModule.default && typeof entryModule.default.canParse === "function") {
            detectFn = entryModule.default.canParse.bind(entryModule.default);
        }

        return {
            id: manifest.id.toLowerCase(),
            name: manifest.name,
            version: manifest.version,
            description: manifest.description || "",
            type: manifest.type,
            apiVersion: manifest.apiVersion,
            formats: manifest.formats.map((f) => f.toLowerCase()),
            entry: manifest.entry,
            dir: pluginDir,
            enabled: true,
            parser: {
                parse: parseFn,
                detect: detectFn
            }
        };
    }
}

export default PluginLoader;
