import React, { useState } from "react";

/**
 * Reusable JSON Viewer component with Copy to Clipboard support.
 * @param {Object|Array|string} data - JSON data or string to format
 * @param {string} [title] - Optional title for the viewer card
 * @param {number} [maxHeight] - Optional max height for scrollable content (e.g. 400)
 */
export function JsonViewer({ data, title, maxHeight = 400 }) {
  const [copied, setCopied] = useState(false);

  let formattedText = "";
  try {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        formattedText = JSON.stringify(parsed, null, 2);
      } catch {
        formattedText = data;
      }
    } else {
      formattedText = JSON.stringify(data, null, 2);
    }
  } catch (err) {
    formattedText = String(data);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        color: "#f8fafc",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #334155",
        fontSize: "0.85rem",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 1rem",
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #334155"
        }}
      >
        <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>
          {title || "JSON Output"}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            backgroundColor: copied ? "#10b981" : "#334155",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "0.25rem 0.6rem",
            fontSize: "0.75rem",
            cursor: "pointer",
            fontWeight: 500,
            transition: "background-color 0.15s"
          }}
        >
          {copied ? "✓ Copied" : "Copy JSON"}
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: "1rem",
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: `${maxHeight}px`,
          lineHeight: 1.5,
          color: "#e2e8f0"
        }}
      >
        <code>{formattedText}</code>
      </pre>
    </div>
  );
}

export default JsonViewer;
