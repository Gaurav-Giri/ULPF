/**
 * Core Plugin Registry
 * Stores and indexes loaded parser plugins by ID and supported formats.
 */

class PluginRegistry {
    constructor() {
        this.plugins = new Map();
        this.formatMap = new Map();
    }

    /**
     * Register a plugin descriptor.
     * @param {Object} plugin
     */
    register(plugin) {
        if (!plugin || !plugin.id) {
            throw new Error("Cannot register plugin without an id");
        }

        const normalizedId = plugin.id.toLowerCase();
        if (this.plugins.has(normalizedId)) {
            throw new Error(`Plugin already registered with id: ${plugin.id}`);
        }

        this.plugins.set(normalizedId, plugin);

        if (plugin.enabled && Array.isArray(plugin.formats)) {
            for (const format of plugin.formats) {
                const normalizedFormat = format.toLowerCase();
                this.formatMap.set(normalizedFormat, normalizedId);
            }
        }
    }

    /**
     * Unregister a plugin by ID.
     * @param {string} pluginId
     */
    unregister(pluginId) {
        if (!pluginId) return false;
        const normalizedId = pluginId.toLowerCase();
        const plugin = this.plugins.get(normalizedId);
        if (!plugin) return false;

        this.plugins.delete(normalizedId);

        // Remove associated format mappings
        for (const [format, id] of this.formatMap.entries()) {
            if (id === normalizedId) {
                this.formatMap.delete(format);
            }
        }
        return true;
    }

    /**
     * Check if plugin is registered.
     * @param {string} pluginId
     */
    has(pluginId) {
        if (!pluginId) return false;
        return this.plugins.has(pluginId.toLowerCase());
    }

    /**
     * Get plugin by ID (enabled or disabled).
     * @param {string} pluginId
     */
    get(pluginId) {
        if (!pluginId) return null;
        return this.plugins.get(pluginId.toLowerCase()) || null;
    }

    /**
     * Get all registered plugins.
     */
    getAll() {
        return Array.from(this.plugins.values());
    }

    /**
     * Get all enabled plugins.
     */
    getEnabled() {
        return Array.from(this.plugins.values()).filter((p) => p.enabled);
    }

    /**
     * Get enabled parser plugin for a specific format.
     * @param {string} format
     */
    getByFormat(format) {
        if (!format) return null;
        const normalizedFormat = format.toLowerCase();
        const pluginId = this.formatMap.get(normalizedFormat);
        if (!pluginId) return null;

        const plugin = this.plugins.get(pluginId);
        if (plugin && plugin.enabled) {
            return plugin;
        }
        return null;
    }

    /**
     * Get all formats supported by currently enabled plugins.
     */
    getSupportedFormats() {
        return Array.from(this.formatMap.keys());
    }

    /**
     * Clear all registered plugins.
     */
    clear() {
        this.plugins.clear();
        this.formatMap.clear();
    }
}

export const pluginRegistry = new PluginRegistry();
export default pluginRegistry;
