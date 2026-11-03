import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useHealth } from "../../hooks/useHealth.js";
import { getParsers } from "../../api/parsersApi.js";
import { getEvents } from "../../api/eventsApi.js";
import { Card } from "../../components/common/Card.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { ROUTES } from "../../constants/routes.js";

export function DashboardPage() {
  const { data, loading: healthLoading, isHealthy, error: healthError, refresh: refreshHealth } = useHealth();
  const [parserStats, setParserStats] = useState({ count: 0, formats: [], loading: true });
  const [eventStats, setEventStats] = useState({ totalEvents: 0, loading: true });

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const parsersRes = await getParsers();
        if (isMounted) {
          const list = parsersRes.parsers || [];
          const formats = Array.from(new Set(list.flatMap((p) => p.formats || [])));
          setParserStats({ count: list.length, formats, loading: false });
        }
      } catch (err) {
        if (isMounted) setParserStats({ count: 0, formats: [], loading: false });
      }

      try {
        const eventsRes = await getEvents({ limit: 1 });
        if (isMounted) {
          setEventStats({ totalEvents: eventsRes.data?.total || 0, loading: false });
        }
      } catch (err) {
        if (isMounted) setEventStats({ totalEvents: 0, loading: false });
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAll = () => {
    refreshHealth();
    getParsers()
      .then((res) => {
        const list = res.parsers || [];
        const formats = Array.from(new Set(list.flatMap((p) => p.formats || [])));
        setParserStats({ count: list.length, formats, loading: false });
      })
      .catch(() => {});

    getEvents({ limit: 1 })
      .then((res) => {
        setEventStats({ totalEvents: res.data?.total || 0, loading: false });
      })
      .catch(() => {});
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>
          System Dashboard
        </h1>
        <p style={{ margin: "0.5rem 0 0", color: "#6b7280", fontSize: "0.95rem" }}>
          Overview of the Universal Log Pre-processing Framework pipeline health, active parser plugins, and indexed event telemetry.
        </p>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.5rem"
        }}
      >
        {/* Metric 1: Pipeline Gateway Status */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.35rem", fontWeight: 600 }}>
            PIPELINE HEALTH
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
            {healthLoading ? (
              <span style={{ color: "#9ca3af", fontSize: "1.1rem" }}>Checking...</span>
            ) : isHealthy ? (
              <>
                <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#15803d" }}>Online</span>
                <Badge variant="success">HTTP 200</Badge>
              </>
            ) : (
              <>
                <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#b91c1c" }}>Offline</span>
                <Badge variant="danger">Disconnected</Badge>
              </>
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
            Express Gateway (Port 5000)
          </div>
        </div>

        {/* Metric 2: Installed Parsers */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.35rem", fontWeight: 600 }}>
            ACTIVE PARSER PLUGINS
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1f2937", marginTop: "0.25rem" }}>
            {parserStats.loading ? "..." : parserStats.count}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.5rem" }}>
            {parserStats.formats.map((fmt) => (
              <Badge key={fmt} variant="info">{fmt}</Badge>
            ))}
          </div>
        </div>

        {/* Metric 3: Total Indexed Events */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.35rem", fontWeight: 600 }}>
            TOTAL EVENTS INDEXED
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1f2937", marginTop: "0.25rem" }}>
            {eventStats.loading ? "..." : eventStats.totalEvents.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
            Stored in OpenSearch (<code>ulpf-events</code>)
          </div>
        </div>

        {/* Metric 4: Storage & Integrity */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.35rem", fontWeight: 600 }}>
            RAW ARCHIVAL STORAGE
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1f2937", marginTop: "0.25rem" }}>
            MinIO Object S3
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
            SHA-256 Verified (<code>ulpf-raw-events</code>)
          </div>
        </div>
      </div>

      {/* Backend Details Card */}
      <Card
        title="Backend Gateway Overview"
        subtitle="Live connection details to the ULPF ingestion runtime"
        extra={
          <button
            onClick={refreshAll}
            disabled={healthLoading}
            style={{
              padding: "0.4rem 0.8rem",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: healthLoading ? "default" : "pointer",
              fontSize: "0.85rem",
              fontWeight: 500
            }}
          >
            {healthLoading ? "Checking..." : "↻ Refresh All Stats"}
          </button>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.35rem" }}>Service Name</div>
            <div style={{ fontWeight: 600, color: "#1f2937" }}>
              {data?.service || "ULPF Backend"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.35rem" }}>Environment</div>
            <div style={{ fontWeight: 600, color: "#1f2937" }}>
              {data?.environment || "development"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.35rem" }}>API Base URL</div>
            <div style={{ fontSize: "0.85rem", color: "#4b5563", fontFamily: "monospace" }}>
              {import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.35rem" }}>CORS Origin</div>
            <div style={{ fontSize: "0.85rem", color: "#4b5563", fontFamily: "monospace" }}>
              http://localhost:5173
            </div>
          </div>
        </div>

        {healthError && (
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.75rem 1rem",
              backgroundColor: "#fef2f2",
              borderRadius: "6px",
              color: "#b91c1c",
              fontSize: "0.85rem"
            }}
          >
            <strong>Connection Alert:</strong> {healthError.message}
          </div>
        )}
      </Card>

      {/* Quick Navigation Cards */}
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>
        Core Framework Modules
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
        <Link to={ROUTES.EVENTS} style={{ textDecoration: "none", color: "inherit" }}>
          <Card style={{ height: "100%", cursor: "pointer", transition: "box-shadow 0.2s" }}>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📋</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#111827" }}>Events Explorer</h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.45 }}>
              Search, filter by severity, format, category, and view normalized events with SHA-256 verification.
            </p>
          </Card>
        </Link>

        <Link to={ROUTES.INGEST} style={{ textDecoration: "none", color: "inherit" }}>
          <Card style={{ height: "100%", cursor: "pointer", transition: "box-shadow 0.2s" }}>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📥</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#111827" }}>Event Ingestion</h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.45 }}>
              Submit raw logs asynchronously through the RabbitMQ pipeline to MinIO & OpenSearch.
            </p>
          </Card>
        </Link>

        <Link to={ROUTES.DETECT} style={{ textDecoration: "none", color: "inherit" }}>
          <Card style={{ height: "100%", cursor: "pointer", transition: "box-shadow 0.2s" }}>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>🔍</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#111827" }}>Format Detection</h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.45 }}>
              Test automatic format detection on arbitrary log payloads against enabled parser plugins.
            </p>
          </Card>
        </Link>

        <Link to={ROUTES.PARSERS} style={{ textDecoration: "none", color: "inherit" }}>
          <Card style={{ height: "100%", cursor: "pointer", transition: "box-shadow 0.2s" }}>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>🧩</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#111827" }}>Parser Catalog</h3>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.45 }}>
              Browse installed parser plugins, dry-run test parsers, and trigger live plugin reloads.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default DashboardPage;
