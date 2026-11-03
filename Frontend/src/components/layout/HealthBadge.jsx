import React from "react";
import { useHealth } from "../../hooks/useHealth.js";
import { Badge } from "../common/Badge.jsx";

/**
 * Visual badge displaying ULPF Backend connection state.
 */
export function HealthBadge() {
  const { data, loading, isHealthy, error, refresh } = useHealth();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.4rem 0.8rem",
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        fontSize: "0.85rem"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: loading ? "#9ca3af" : isHealthy ? "#10b981" : "#ef4444",
            display: "inline-block"
          }}
        />
        <span style={{ fontWeight: 500, color: "#374151" }}>
          Backend:
        </span>
        {loading ? (
          <span style={{ color: "#9ca3af" }}>Checking...</span>
        ) : isHealthy ? (
          <Badge variant="success">Online ({data.environment || "dev"})</Badge>
        ) : (
          <Badge variant="danger">Disconnected</Badge>
        )}
      </div>

      <button
        onClick={refresh}
        disabled={loading}
        title="Refresh backend health"
        style={{
          background: "none",
          border: "none",
          cursor: loading ? "default" : "pointer",
          color: "#6b7280",
          fontSize: "0.8rem",
          padding: "0.1rem 0.3rem",
          borderRadius: "4px"
        }}
      >
        {loading ? "..." : "↻"}
      </button>
    </div>
  );
}

export default HealthBadge;
