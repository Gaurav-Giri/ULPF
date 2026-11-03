import React from "react";

/**
 * Reusable Card container component.
 */
export function Card({ title, subtitle, extra, children, style = {} }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        overflow: "hidden",
        marginBottom: "1.5rem",
        ...style
      }}
    >
      {(title || subtitle || extra) && (
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "#111827" }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
                {subtitle}
              </p>
            )}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div style={{ padding: "1.5rem" }}>
        {children}
      </div>
    </div>
  );
}

export default Card;
