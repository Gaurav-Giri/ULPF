import apiClient from "./client.js";

/**
 * Parsers API module
 */

/**
 * List all discovered parser plugins and their status.
 * @returns {Promise<Object>} { success: true, parsers: Array }
 */
export async function getParsers() {
  const response = await apiClient.get("/api/v1/parsers");
  return response.data;
}

/**
 * Retrieve metadata for a single parser plugin by ID.
 * @param {string} parserId
 * @returns {Promise<Object>} { success: true, parser: Object }
 */
export async function getParserById(parserId) {
  const response = await apiClient.get(`/api/v1/parsers/${parserId}`);
  return response.data;
}

/**
 * Hot-reload all parser plugins from disk.
 * @returns {Promise<Object>} { success: true, message: string, summary: Object, parsers: Array }
 */
export async function reloadParsers() {
  const response = await apiClient.post("/api/v1/parsers/reload");
  return response.data;
}

/**
 * Dry-run / test a parser against sample log text without storing it.
 * @param {string} parserId
 * @param {string} payload - Raw sample log string
 * @returns {Promise<Object>} { success: true, parser_id: string, data: Object }
 */
export async function testParser(parserId, payload) {
  const response = await apiClient.post(`/api/v1/parsers/${parserId}/test`, { payload });
  return response.data;
}

export default {
  getParsers,
  getParserById,
  reloadParsers,
  testParser
};
