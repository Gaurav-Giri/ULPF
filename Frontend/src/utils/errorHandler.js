/**
 * Normalizes Axios and Network errors into a consistent structure for UI consumption.
 * Prevents raw Axios internal error objects from leaking into component state.
 */
export function normalizeApiError(error) {
  if (!error) {
    return {
      message: "An unknown error occurred",
      status: null,
      isNetworkError: false,
      data: null
    };
  }

  // Axios network error (no response received)
  if (error.isAxiosError && !error.response) {
    return {
      message: error.message || "Network error: Unable to connect to ULPF backend",
      status: null,
      isNetworkError: true,
      data: null
    };
  }

  // Axios HTTP error response from server
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    let message = "Server request failed";

    if (data && typeof data === "object") {
      if (typeof data.message === "string") {
        message = data.message;
      } else if (typeof data.error === "string") {
        message = data.error;
      }
    } else if (typeof data === "string" && data.trim()) {
      message = data;
    }

    return {
      message,
      status,
      isNetworkError: false,
      data
    };
  }

  // Standard JavaScript Error
  return {
    message: error.message || "An unexpected error occurred",
    status: null,
    isNetworkError: false,
    data: null
  };
}
