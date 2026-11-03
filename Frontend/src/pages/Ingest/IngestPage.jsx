import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ingestEvent } from "../../api/eventsApi.js";
import { Card } from "../../components/common/Card.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { ErrorAlert } from "../../components/common/ErrorAlert.jsx";
import { ROUTES } from "../../constants/routes.js";

const SAMPLE_LOGS = {
  json: {
    name: "JSON Application Log",
    format: "json",
    source: "web-app-01",
    payload: JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        host: "web-app-01",
        source_type: "application",
        vendor: "AuthService",
        category: "authentication",
        action: "user_login",
        level: "info",
        src_ip: "192.168.1.105",
        dst_ip: "10.0.0.15",
        src_port: 54322,
        dst_port: 443,
        protocol: "tcp",
        message: "User admin authenticated successfully via OAuth2"
      },
      null,
      2
    )
  },
  syslog_5424: {
    name: "Syslog RFC 5424",
    format: "syslog",
    source: "firewall-edge-01",
    payload: `<34>1 ${new Date().toISOString()} firewall-edge-01 kernel - - [meta sequenceId="1"] BLOCK src_ip=203.0.113.45 dst_ip=192.168.1.1 port=22 protocol=tcp Drop unauthorized SSH attempt`
  },
  syslog_3164: {
    name: "Syslog RFC 3164",
    format: "syslog",
    source: "switch-core-01",
    payload: "<189>Nov 02 14:22:10 switch-core-01 ALLOW src_ip=10.10.20.55 dst_ip=10.10.0.1 port=80 HTTP connection established"
  },
  cef: {
    name: "ArcSight CEF",
    format: "cef",
    source: "checkpoint-firewall",
    payload: `CEF:0|CheckPoint|VPN-Gateway|R81.10|1000|VPN Tunnel Negotiated|5|src=198.51.100.22 dst=172.16.0.1 spt=500 dpt=500 proto=udp dvchost=checkpoint-gw msg="IKE Phase 2 tunnel established"`
  },
  leef: {
    name: "IBM QRadar LEEF",
    format: "leef",
    source: "qradar-siem-collector",
    payload: `LEEF:1.0|Microsoft|ActiveDirectory|2022|4624|devName=dc01.corp.internal\tsrc=10.0.4.88\tdst=10.0.0.5\tspt=49152\tdpt=389\tproto=tcp\taction=LogonSuccess\tseverity=3\tmsg=Account successfully logged on`
  }
};

export function IngestPage() {
  const [source, setSource] = useState("api_ingest");
  const [format, setFormat] = useState("auto");
  const [payload, setPayload] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [recentIngests, setRecentIngests] = useState([]);
  const [successBanner, setSuccessBanner] = useState(null);

  const loadSample = (sampleKey) => {
    const sample = SAMPLE_LOGS[sampleKey];
    if (sample) {
      setSource(sample.source);
      setFormat(sample.format);
      setPayload(sample.payload);
      setError(null);
      setSuccessBanner(null);
    }
  };

  const handleClear = () => {
    setPayload("");
    setError(null);
    setSuccessBanner(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payload.trim()) {
      setError({ message: "Payload cannot be empty. Please enter or select a sample log." });
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessBanner(null);

    const eventData = {
      payload: payload.trim(),
      source: source.trim() || "api_ingest"
    };

    if (format && format !== "auto") {
      eventData.format = format;
    }

    try {
      const response = await ingestEvent(eventData);

      const record = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        source: eventData.source,
        format: eventData.format || "auto-detected",
        payloadSnippet: payload.trim().slice(0, 70) + (payload.trim().length > 70 ? "..." : ""),
        status: response.status || "accepted"
      };

      setRecentIngests((prev) => [record, ...prev.slice(0, 9)]);
      setSuccessBanner({
        message: response.message || "Event successfully accepted for processing.",
        status: response.status || "accepted",
        source: eventData.source,
        format: eventData.format || "auto-detected"
      });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>
          Log Ingestion Portal
        </h1>
        <p style={{ margin: "0.5rem 0 0", color: "#6b7280", fontSize: "0.95rem" }}>
          Submit raw logs into the asynchronous ingestion queue. Events are buffered in RabbitMQ,
          archived verbatim with SHA-256 integrity in MinIO, normalized, and indexed in OpenSearch.
        </p>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div
          style={{
            padding: "1.25rem",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <Badge variant="success">HTTP 202 Accepted</Badge>
              <strong style={{ color: "#065f46", fontSize: "0.95rem" }}>
                {successBanner.message}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#047857" }}>
              Queued as source <code>{successBanner.source}</code> with format{" "}
              <code>{successBanner.format}</code>. The event worker is processing it in the background.
            </p>
          </div>
          <Link
            to={ROUTES.EVENTS}
            style={{
              padding: "0.45rem 0.9rem",
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 600
            }}
          >
            Open Events Explorer →
          </Link>
        </div>
      )}

      {/* Error Alert */}
      {error && <ErrorAlert error={error} onRetry={() => handleSubmit({ preventDefault: () => {} })} />}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Ingestion Form */}
        <Card
          title="Submit Raw Log Event"
          subtitle="Direct injection to POST /api/v1/events"
          extra={<Badge variant="info">Asynchronous Pipeline</Badge>}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              {/* Source Field */}
              <div>
                <label
                  htmlFor="source-input"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}
                >
                  Source Name
                </label>
                <input
                  id="source-input"
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. firewall-gw-01, app-server-02"
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
              </div>

              {/* Format Hint Selector */}
              <div>
                <label
                  htmlFor="format-select"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}
                >
                  Format Hint (Optional)
                </label>
                <select
                  id="format-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    backgroundColor: "#ffffff",
                    outline: "none"
                  }}
                >
                  <option value="auto">Auto-Detect (Recommended)</option>
                  <option value="json">JSON</option>
                  <option value="syslog">Syslog (RFC 3164 / 5424)</option>
                  <option value="cef">CEF (ArcSight)</option>
                  <option value="leef">LEEF (IBM QRadar)</option>
                </select>
              </div>
            </div>

            {/* Payload Textarea */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label
                  htmlFor="payload-textarea"
                  style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}
                >
                  Raw Log Payload *
                </label>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {payload.length} characters
                </span>
              </div>
              <textarea
                id="payload-textarea"
                rows={9}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder="Paste raw log string, JSON object, Syslog line, CEF, or LEEF record..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  lineHeight: 1.45,
                  outline: "none",
                  resize: "vertical",
                  backgroundColor: "#ffffff"
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: "0.55rem 1rem",
                  backgroundColor: "#f3f4f6",
                  color: "#4b5563",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500
                }}
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={submitting || !payload.trim()}
                style={{
                  padding: "0.6rem 1.5rem",
                  backgroundColor: submitting || !payload.trim() ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: submitting || !payload.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                {submitting ? "Queueing Event..." : "Queue Log Event →"}
              </button>
            </div>
          </form>
        </Card>

        {/* Sidebar: Sample Presets & Information */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card
            title="Load Sample Logs"
            subtitle="Populate form with standard format examples"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {Object.entries(SAMPLE_LOGS).map(([key, sample]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => loadSample(key)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.8rem",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1f2937" }}>
                    {sample.name}
                  </span>
                  <Badge variant="neutral">{sample.format}</Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card
            title="Pipeline Architecture Notice"
            subtitle="How event ingestion works"
          >
            <div style={{ fontSize: "0.825rem", color: "#4b5563", lineHeight: 1.5 }}>
              <p style={{ margin: "0 0 0.5rem" }}>
                <strong>1. Decoupled Ingestion:</strong> The HTTP endpoint writes directly to
                RabbitMQ exchange <code>ulpf.events</code> and returns <code>HTTP 202</code> immediately.
              </p>
              <p style={{ margin: "0 0 0.5rem" }}>
                <strong>2. Integrity Archival:</strong> Before parsing, a SHA-256 hash is calculated
                and the raw log is uploaded to MinIO.
              </p>
              <p style={{ margin: 0 }}>
                <strong>3. Normalization:</strong> The background worker detects the format, runs the
                matching plug-and-play parser, validates with Zod, and indexes into OpenSearch.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Session Ingestion History */}
      {recentIngests.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <Card
            title="Session Ingestion Activity"
            subtitle="Events queued during this browser session"
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Time</th>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Source</th>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Format</th>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Payload Snippet</th>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIngests.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.6rem 0.75rem", color: "#6b7280" }}>{item.timestamp}</td>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600, color: "#111827" }}>
                        {item.source}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        <Badge variant="info">{item.format}</Badge>
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", fontFamily: "monospace", color: "#4b5563" }}>
                        {item.payloadSnippet}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        <Badge variant="success">{item.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default IngestPage;
