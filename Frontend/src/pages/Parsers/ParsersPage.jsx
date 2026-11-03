import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getParsers, reloadParsers } from "../../api/parsersApi.js";
import { Card } from "../../components/common/Card.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { ErrorAlert } from "../../components/common/ErrorAlert.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { ROUTES } from "../../constants/routes.js";

export function ParsersPage() {
  const [parsers, setParsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadNotice, setReloadNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchParsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getParsers();
      setParsers(response.parsers || []);
    } catch (err) {
      setError(err);
      setParsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParsers();
  }, [fetchParsers]);

  const handleReload = async () => {
    setReloading(true);
    setError(null);
    setReloadNotice(null);
    try {
      const response = await reloadParsers();
      setParsers(response.parsers || []);
      setReloadNotice({
        message: response.message || "Plugins reloaded successfully from disk.",
        summary: response.summary
      });
    } catch (err) {
      setError(err);
    } finally {
      setReloading(false);
    }
  };

  const filteredParsers = parsers.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = p.name && p.name.toLowerCase().includes(q);
    const idMatch = p.id && p.id.toLowerCase().includes(q);
    const formatMatch = Array.isArray(p.formats) && p.formats.some((f) => f.toLowerCase().includes(q));
    const descMatch = p.description && p.description.toLowerCase().includes(q);
    return nameMatch || idMatch || formatMatch || descMatch;
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>
          Parser Plugin Catalog
        </h1>
        <p style={{ margin: "0.5rem 0 0", color: "#6b7280", fontSize: "0.95rem" }}>
          Plug-and-play parser plugins discovered in <code>Backend/plugins/parsers/</code>. Each plugin
          exports isolated detection and parsing routines complying with ULPF API v1.0.
        </p>
      </div>

      {/* Reload Notification Banner */}
      {reloadNotice && (
        <div
          style={{
            padding: "1rem 1.25rem",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <strong style={{ color: "#065f46", fontSize: "0.925rem" }}>
              ✓ {reloadNotice.message}
            </strong>
            {reloadNotice.summary && (
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.825rem", color: "#047857" }}>
                Discovered: {reloadNotice.summary.loaded} active | {reloadNotice.summary.disabled} disabled | {reloadNotice.summary.failed} failed
              </p>
            )}
          </div>
          <button
            onClick={() => setReloadNotice(null)}
            style={{
              background: "none",
              border: "none",
              color: "#065f46",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && <ErrorAlert error={error} onRetry={fetchParsers} />}

      {/* Toolbar: Search and Reload Control */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, maxWidth: "450px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins by name, format, or ID..."
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              outline: "none"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                padding: "0.5rem 0.75rem",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.8rem"
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Showing <strong>{filteredParsers.length}</strong> of {parsers.length} plugins
          </span>

          <button
            onClick={handleReload}
            disabled={reloading || loading}
            style={{
              padding: "0.55rem 1rem",
              backgroundColor: reloading ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: reloading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            {reloading ? "Reloading..." : "↻ Reload from Disk"}
          </button>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <LoadingSpinner message="Scanning parser plugins directory..." />
      ) : filteredParsers.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#6b7280" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 600, color: "#374151" }}>
              {searchQuery ? "No matching plugins found" : "No parser plugins installed"}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              {searchQuery
                ? `No plugins matched "${searchQuery}". Try a different search term.`
                : "Add plugin directories to Backend/plugins/parsers/ and click 'Reload from Disk'."}
            </p>
          </div>
        </Card>
      ) : (
        /* Parsers Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem"
          }}
        >
          {filteredParsers.map((parser) => (
            <Card
              key={parser.id}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                marginBottom: 0
              }}
            >
              <div>
                {/* Plugin Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                      {parser.name}
                    </h3>
                    <code style={{ fontSize: "0.75rem", color: "#6b7280" }}>id: {parser.id}</code>
                  </div>
                  <Badge variant={parser.enabled ? "success" : "neutral"}>
                    {parser.enabled ? `v${parser.version}` : "Disabled"}
                  </Badge>
                </div>

                {/* Description */}
                <p
                  style={{
                    margin: "0.5rem 0 1rem",
                    color: "#4b5563",
                    fontSize: "0.85rem",
                    lineHeight: 1.45,
                    minHeight: "2.6rem"
                  }}
                >
                  {parser.description || "No description provided in manifest."}
                </p>

                {/* Formats Badges */}
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "0.3rem" }}>
                    Handled Formats:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {Array.isArray(parser.formats) && parser.formats.length > 0 ? (
                      parser.formats.map((fmt) => (
                        <Badge key={fmt} variant="info">
                          {fmt}
                        </Badge>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>None specified</span>
                    )}
                  </div>
                </div>

                {/* Plugin Specs Info */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid #f3f4f6",
                    marginBottom: "1rem"
                  }}
                >
                  <span>Type: <code>{parser.type}</code></span>
                  <span>API: <code>{parser.apiVersion}</code></span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={ROUTES.PARSER_DETAIL(parser.id)}
                style={{
                  display: "block",
                  padding: "0.55rem 1rem",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  color: "#2563eb",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  textAlign: "center",
                  textDecoration: "none",
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#eff6ff";
                  e.currentTarget.style.borderColor = "#bfdbfe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              >
                Inspect & Test Sandbox →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParsersPage;
