import React from "react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";

const NAV_ITEMS = [
  { label: "Dashboard", path: ROUTES.DASHBOARD, icon: "📊" },
  { label: "Events", path: ROUTES.EVENTS, icon: "📋" },
  { label: "Ingest Log", path: ROUTES.INGEST, icon: "📥" },
  { label: "Detect Format", path: ROUTES.DETECT, icon: "🔍" },
  { label: "Parsers Catalog", path: ROUTES.PARSERS, icon: "🧩" }
];

/**
 * Sidebar navigation component.
 */
export function Sidebar() {
  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: "#1f2937",
        color: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          borderBottom: "1px solid #374151",
          gap: "0.75rem"
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>⚡</span>
        <span style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.05em", color: "#60a5fa" }}>
          ULPF Console
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === ROUTES.DASHBOARD}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 1rem",
              borderRadius: "6px",
              color: isActive ? "#ffffff" : "#9ca3af",
              backgroundColor: isActive ? "#374151" : "transparent",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: isActive ? 600 : 500,
              transition: "background-color 0.15s, color 0.15s"
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderTop: "1px solid #374151",
          fontSize: "0.75rem",
          color: "#9ca3af"
        }}
      >
        <div>ULPF v1.0.0</div>
        <div style={{ color: "#6b7280", marginTop: "0.2rem" }}>Log Pre-processing</div>
      </div>
    </aside>
  );
}

export default Sidebar;
