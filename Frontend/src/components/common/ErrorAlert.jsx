import React from "react";

/**
 * Reusable Error Alert component for normalized API errors.
 */
export function ErrorAlert({ error, onRetry, title = "Request Failed" }) {
  if (!error) return null;

  const errorMessage =
    typeof error === "string"
      ? error
      : error.message || "An unexpected error occurred.";

  const isNetwork = error.isNetworkError;

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        color: "#991b1b",
        marginBottom: "1rem"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <strong style={{ fontSize: "0.925rem", display: "block", marginBottom: "0.25rem" }}>
            {title} {error.status ? `(HTTP ${error.status})` : ""}
          </strong>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#b91c1c" }}>
            {errorMessage}
          </p>
          {isNetwork && (
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#6b7280" }}>
              Please ensure the backend is running at {import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}.
            </p>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              backgroundColor: "#ffffff",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorAlert;
