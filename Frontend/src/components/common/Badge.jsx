import React from "react";

/**
 * Reusable Badge component for status indicators, formats, and severities.
 * @param {'success'|'warning'|'danger'|'info'|'neutral'} variant
 */
export function Badge({ children, variant = "neutral", className = "" }) {
  const variantStyles = {
    success: {
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      color: "#059669",
      borderColor: "rgba(16, 185, 129, 0.3)"
    },
    warning: {
      backgroundColor: "rgba(245, 158, 11, 0.15)",
      color: "#d97706",
      borderColor: "rgba(245, 158, 11, 0.3)"
    },
    danger: {
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      color: "#dc2626",
      borderColor: "rgba(239, 68, 68, 0.3)"
    },
    info: {
      backgroundColor: "rgba(59, 130, 246, 0.15)",
      color: "#2563eb",
      borderColor: "rgba(59, 130, 246, 0.3)"
    },
    neutral: {
      backgroundColor: "rgba(107, 114, 128, 0.15)",
      color: "#4b5563",
      borderColor: "rgba(107, 114, 128, 0.3)"
    }
  };

  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "600",
    border: "1px solid",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
    lineHeight: 1,
    ...variantStyles[variant]
  };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
}

export default Badge;
