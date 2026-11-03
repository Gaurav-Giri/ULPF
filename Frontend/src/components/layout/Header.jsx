import React from "react";
import { HealthBadge } from "./HealthBadge.jsx";

/**
 * Top Header component.
 */
export function Header() {
  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#111827" }}>
          Universal Log Pre-processing Framework
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <HealthBadge />
      </div>
    </header>
  );
}

export default Header;
