import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";

export function NotFoundPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        textAlign: "center"
      }}
    >
      <div style={{ fontSize: "4rem", fontWeight: 800, color: "#9ca3af", marginBottom: "0.5rem" }}>
        404
      </div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", color: "#111827" }}>
        Page Not Found
      </h1>
      <p style={{ margin: "0 0 1.5rem", color: "#6b7280", maxWidth: "400px" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        style={{
          padding: "0.6rem 1.25rem",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "0.9rem"
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;
