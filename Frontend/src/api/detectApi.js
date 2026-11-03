import apiClient from "./client.js";

/**
 * Format Detection API module
 */

/**
 * Automatically detect format of a supplied log payload using active parser plugins.
 * @param {string} payload - Raw log text
 * @returns {Promise<Object>} { success: true, format: string, confidence: number, data: Object }
 */
export async function detectFormat(payload) {
  const response = await apiClient.post("/api/v1/detect", { payload });
  return response.data;
}

export default {
  detectFormat
};
