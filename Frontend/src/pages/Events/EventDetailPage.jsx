import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getEventById, getRawEventById } from "../../api/eventsApi.js";
import { Card } from "../../components/common/Card.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { ErrorAlert } from "../../components/common/ErrorAlert.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { JsonViewer } from "../../components/common/JsonViewer.jsx";
import { ROUTES } from "../../constants/routes.js";

export function EventDetailPage() {
  const { eventId } = useParams();

  const [eventData, setEventData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("normalized"); // 'normalized' | 'raw_storage' | 'full_json'
  const [copiedId, setCopiedId] = useState(false);

  const fetchEventDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [normalizedRes, rawRes] = await Promise.all([
        getEventById(eventId),
        getRawEventById(eventId)
      ]);

      setEventData(normalizedRes.data);
      setRawData(rawRes.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const copyToClipboard = async (text, setFlag) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getSeverityBadgeVariant = (severity) => {
    if (!severity) return "neutral";
    const s = String(severity).toLowerCase();
    if (s === "0" || s === "1" || s === "2" || s === "emergency" || s === "alert" || s === "critical") {
      return "danger";
    }
    if (s === "3" || s === "4" || s === "error" || s === "warning" || s === "high") {
      return "warning";
    }
    if (s === "5" || s === "6" || s === "notice" || s === "info" || s === "medium" || s === "low") {
      return "info";
    }
    return "neutral";
  };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to={ROUTES.EVENTS} style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>
            ← Back to Events Explorer
          </Link>
        </div>
        <LoadingSpinner message={`Loading event '${eventId}' and verifying cryptographic integrity...`} />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to={ROUTES.EVENTS} style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>
            ← Back to Events Explorer
          </Link>
        </div>
        <ErrorAlert
          error={error || { message: `Event '${eventId}' was not found in OpenSearch or MinIO storage.` }}
          onRetry={fetchEventDetails}
          title="Event Not Found"
        />
      </div>
    );
  }

  const isVerified = rawData?.sha256?.verified === true;

  return (
    <div>
      {/* Header and Back Link */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to={ROUTES.EVENTS}
          style={{
            fontSize: "0.85rem",
            color: "#6b7280",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            marginBottom: "0.5rem"
          }}
        >
          ← Back to Events Explorer
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>
                Event Inspection
              </h1>
              <Badge variant="info">{eventData.raw?.format || "normalized"}</Badge>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#6b7280" }}>
              <span>ID: <code style={{ color: "#2563eb", fontWeight: 600 }}>{eventData.event_id}</code></span>
              <button
                onClick={() => copyToClipboard(eventData.event_id, setCopiedId)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  textDecoration: "underline"
                }}
              >
                {copiedId ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              Received: {new Date(eventData.received_at).toLocaleString()}
            </span>
            <Badge variant={getSeverityBadgeVariant(eventData.event?.severity)}>
              Severity: {eventData.event?.severity || "none"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Cryptographic SHA-256 Integrity Card */}
      <Card
        title="Cryptographic Raw Log Integrity"
        subtitle="Verifies OpenSearch index digest against immutable MinIO raw archive"
        extra={
          <Badge variant={isVerified ? "success" : "danger"}>
            {isVerified ? "✓ SHA-256 Verified" : "✗ Integrity Mismatch"}
          </Badge>
        }
      >
        <div
          style={{
            padding: "1rem",
            backgroundColor: isVerified ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${isVerified ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: "6px",
            marginBottom: "1rem"
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", fontSize: "0.85rem" }}>
            <div>
              <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: "0.2rem" }}>
                Stored SHA-256 (OpenSearch Record):
              </span>
              <code style={{ fontSize: "0.75rem", wordBreak: "break-all", color: "#1f2937" }}>
                {rawData?.sha256?.stored || eventData.raw?.sha256 || "—"}
              </code>
            </div>

            <div>
              <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", marginBottom: "0.2rem" }}>
                Calculated SHA-256 (MinIO Object Stream):
              </span>
              <code style={{ fontSize: "0.75rem", wordBreak: "break-all", color: isVerified ? "#15803d" : "#b91c1c" }}>
                {rawData?.sha256?.calculated || "—"}
              </code>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
          <span><strong>MinIO Bucket:</strong> <code>{rawData?.bucket || "ulpf-raw-events"}</code></span>
          <span><strong>Storage Object Key:</strong> <code>{rawData?.object || "—"}</code></span>
        </div>
      </Card>

      {/* Structured Normalization Attributes */}
      <Card title="Normalized Event Data Model" subtitle="ECS-compliant standardized attributes">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", fontSize: "0.85rem" }}>
          {/* Source Column */}
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Source Coordinates
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div><strong>Name:</strong> {eventData.source?.name || "unknown"}</div>
              <div><strong>Type:</strong> {eventData.source?.type || "unknown"}</div>
              <div><strong>Vendor:</strong> {eventData.source?.vendor || "—"}</div>
            </div>
          </div>

          {/* Event Taxonomy */}
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Event Taxonomy
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div><strong>Category:</strong> {eventData.event?.category || "—"}</div>
              <div><strong>Action:</strong> {eventData.event?.action || "—"}</div>
              <div><strong>Severity:</strong> {eventData.event?.severity || "—"}</div>
            </div>
          </div>

          {/* Network Coordinates */}
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Network Layer
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div>
                <strong>Source:</strong>{" "}
                {eventData.network?.source_ip
                  ? `${eventData.network.source_ip}${eventData.network.source_port ? `:${eventData.network.source_port}` : ""}`
                  : "—"}
              </div>
              <div>
                <strong>Destination:</strong>{" "}
                {eventData.network?.destination_ip
                  ? `${eventData.network.destination_ip}${eventData.network.destination_port ? `:${eventData.network.destination_port}` : ""}`
                  : "—"}
              </div>
              <div><strong>Protocol:</strong> {eventData.network?.protocol ? eventData.network.protocol.toUpperCase() : "—"}</div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Timestamps
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div><strong>Event Time:</strong> {new Date(eventData.timestamp).toLocaleString()}</div>
              <div><strong>Received:</strong> {new Date(eventData.received_at).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {eventData.message && (
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
              Log Message:
            </span>
            <div style={{ padding: "0.75rem", backgroundColor: "#f9fafb", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.85rem", color: "#1f2937" }}>
              {eventData.message}
            </div>
          </div>
        )}
      </Card>

      {/* Tabs: JSON and Raw Archival Payloads */}
      <Card>
        {/* Tab Headers */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "1.25rem", gap: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("normalized")}
            style={{
              padding: "0.6rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "normalized" ? "2px solid #2563eb" : "2px solid transparent",
              color: activeTab === "normalized" ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === "normalized" ? 600 : 500,
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            Normalized Document (OpenSearch)
          </button>

          <button
            onClick={() => setActiveTab("raw_storage")}
            style={{
              padding: "0.6rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "raw_storage" ? "2px solid #2563eb" : "2px solid transparent",
              color: activeTab === "raw_storage" ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === "raw_storage" ? 600 : 500,
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            Original Raw Object (MinIO Storage)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "normalized" ? (
          <div>
            <JsonViewer data={eventData} title="Normalized Event Document" maxHeight={450} />
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "0.75rem", fontSize: "0.85rem", color: "#4b5563" }}>
              Below is the verbatim raw log object reconstructed from MinIO S3 object storage:
            </div>
            <JsonViewer
              data={rawData?.raw_event || { message: "Raw storage object not available" }}
              title="MinIO Raw Storage Object"
              maxHeight={450}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export default EventDetailPage;
