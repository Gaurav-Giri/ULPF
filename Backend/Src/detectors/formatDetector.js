import { pluginRegistry } from "../core/plugins/pluginRegistry.js";

/**
 * Universal Format Detector
 * Evaluates payload against all currently enabled parser plugins.
 * Dynamically queries active plugins for format recognition.
 *
 * @param {string} payload - Raw event payload string
 * @returns {{ format: string, confidence: number }}
 */
export function detectFormat(payload) {
    if (!payload || typeof payload !== "string") {
        return {
            format: "unknown",
            confidence: 0
        };
    }

    const enabledPlugins = pluginRegistry.getEnabled();
    let bestMatch = null;

    for (const plugin of enabledPlugins) {
        const detectFn = plugin.parser?.detect;
        if (typeof detectFn === "function") {
            try {
                const result = detectFn(payload);
                if (result) {
                    const isMatch =
                        typeof result === "object"
                            ? Boolean(result.match)
                            : Boolean(result);

                    if (isMatch) {
                        const confidence =
                            typeof result === "object" &&
                            typeof result.confidence === "number"
                                ? result.confidence
                                : 1.0;

                        const format = plugin.formats[0] || plugin.id;

                        if (!bestMatch || confidence > bestMatch.confidence) {
                            bestMatch = {
                                format,
                                confidence
                            };

                            if (confidence >= 1.0) {
                                break;
                            }
                        }
                    }
                }
            } catch {
                // Ignore detector errors and continue to next plugin
            }
        }
    }

    if (bestMatch) {
        return bestMatch;
    }

    return {
        format: "unknown",
        confidence: 0
    };
}

export default detectFormat;