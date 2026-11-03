import React from "react";

/**
 * Reusable lightweight Loading Spinner.
 */
export function LoadingSpinner({ message = "Loading...", size = "medium" }) {
  const sizeMap = {
    small: "16px",
    medium: "24px",
    large: "40px"
  };

  const spinnerDimension = sizeMap[size] || sizeMap.medium;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "1.5rem"
      }}
    >
      <div
        style={{
          width: spinnerDimension,
          height: spinnerDimension,
          border: "3px solid #e5e7eb",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "ulpf-spin 0.8s linear infinite"
        }}
      />
      {message && (
        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          {message}
        </span>
      )}
    </div>
  );
}

export default LoadingSpinner;
