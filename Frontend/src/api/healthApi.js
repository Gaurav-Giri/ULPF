import apiClient from "./client.js";

/**
 * Health API module
 */
export async function getHealth() {
  const response = await apiClient.get("/api/health");
  return response.data;
}

export default {
  getHealth
};
