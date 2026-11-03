import apiClient from "./client.js";

/**
 * Events API module
 */

/**
 * Submit raw event payload for asynchronous processing.
 * @param {Object} eventData - { payload: string, source?: string, format?: string }
 * @returns {Promise<Object>} { success: true, status: "accepted", message: string }
 */
export async function ingestEvent(eventData) {
  const response = await apiClient.post("/api/v1/events", eventData);
  return response.data;
}

/**
 * Search/list/paginate normalized events.
 * @param {Object} [params] - { query, source, format, category, severity, from, to, page, limit }
 * @returns {Promise<Object>} { success: true, data: { page, limit, total, total_pages, events } }
 */
export async function getEvents(params = {}) {
  const response = await apiClient.get("/api/v1/events", { params });
  return response.data;
}

/**
 * Retrieve one normalized event by ID.
 * @param {string} eventId
 * @returns {Promise<Object>} { success: true, data: UniversalEvent }
 */
export async function getEventById(eventId) {
  const response = await apiClient.get(`/api/v1/events/${eventId}`);
  return response.data;
}

/**
 * Retrieve archived raw event and cryptographic SHA-256 verification.
 * @param {string} eventId
 * @returns {Promise<Object>} { success: true, data: { event_id, bucket, object, sha256, raw_event } }
 */
export async function getRawEventById(eventId) {
  const response = await apiClient.get(`/api/v1/events/${eventId}/raw`);
  return response.data;
}

export default {
  ingestEvent,
  getEvents,
  getEventById,
  getRawEventById
};
