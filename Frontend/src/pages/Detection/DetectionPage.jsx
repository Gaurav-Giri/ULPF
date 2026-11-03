import React, { useState } from "react";
import { Link } from "react-router-dom";
import { detectFormat } from "../../api/detectApi.js";
import { Card } from "../../components/common/Card.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { ErrorAlert } from "../../components/common/ErrorAlert.jsx";
import { JsonViewer } from "../../components/common/JsonViewer.jsx";
import { ROUTES } from "../../constants/routes.js";

const DETECTION_SAMPLES = {
  json: {
    label: "JSON Application",
    payload: `{"timestamp":"2026-11-02T12:00:00Z","host":"api-gateway-01","category":"network","action":"proxy_request","level":"info","src_ip":"192.168.10.5","dst_ip":"10.0.0.8","message":"Upstream response 200 OK"}`
  },
  syslog_5424: {
    label: "Syslog (RFC 5424)",
    payload: `<34>1 2026-11-02T12:00:00.123Z border-firewall kernel - - [meta sequenceId="42"] DROP src_ip=198.51.100.99 dst_ip=192.168.1.1 port=445 SMB probe dropped`
  },
  syslog_3164: {
    label: "Syslog (RFC 3164)",
    payload: `<13>Nov 02 12:00:00 auth-server-01 sshd[12450]: Failed password for invalid user admin from 203.0.113.195 port 55432 ssh2`
  },
  cef: {
    label: "ArcSight CEF",
    payload: `CEF:0|Palo Alto Networks|PAN-OS|10.1.0|threat|file-download|6|src=10.0.1.55 dst=198.51.100.4 spt=51234 dpt=80 proto=tcp msg="Suspicious executable download"`
  },
  leef: {
    label: "IBM QRadar LEEF",
    payload: `LEEF:1.0|Cisco|ASA|9.12|106015|src=10.1.1.20\tdst=192.168.1.5\tspt=1234\tdpt=80\tproto=tcp\taction=deny\tseverity=4\tmsg=Deny TCP (no connection) from 10.1.1.20 to 192.168.1.5`
  },
  unknown: {
    label: "Custom / Unmatched Format",
    payload: `[RAW_CUSTOM_2026] :: NODE_ALPHA -> STATUS_OK (LATENCY=12ms)`
  }
};

export function DetectionPage() {
  const [payload, setPayload] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const loadSample = (sampleKey) => {
    const sample = DETECTION_SAMPLES[sampleKey];
    if (sample) {
      setPayload(sample.payload);
      setError(null);
      setResult(null);
    }
  };

  const handleClear = () => {
    setPayload("");
    setResult(null);
    setError(null);
  };

  const handleDetect = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!payload.trim()) {
      setError({ message: "Payload cannot be empty. Enter or select a log string to detect." });
      return;
    }

    setDetecting(true);
    setError(null);
    try {
      const response = await detectFormat(payload.trim());
      setResult(response);
    } catch (err) {
      setError(err);
      setResult(null);
    } finally {
      setDetecting(false);
    }
  };

  const isMatched = result && result.format && result.format !== "unknown";
  const confidencePercent = result ? Math.round((result.confidence || 0) * 100) : 0;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>
          Format Auto-Detection
        </h1>
        <p style={{ margin: "0.5rem 0 0", color: "#6b7280", fontSize: "0.95rem" }}>
          Test arbitrary log payloads against all currently enabled parser plugins. The universal
          detector evaluates each plugin's detector hook dynamically without altering any database records.
        </p>
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert error={error} onRetry={handleDetect} />}

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Detection Input Form */}
        <Card
          title="Input Log Payload"
          subtitle="Sent to POST /api/v1/detect"
          extra={<Badge variant="info">Synchronous Inspection</Badge>}
        >
          {/* Quick Preset Buttons */}
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "0.4rem" }}>
              Quick Presets:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {Object.entries(DETECTION_SAMPLES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => loadSample(key)}
                  style={{
                    padding: "0.3rem 0.65rem",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.775rem",
                    fontWeight: 500,
                    color: "#374151"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleDetect}>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <label
                  htmlFor="detect-payload"
                  style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}
                >
                  Raw Log String *
                </label>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {payload.length} chars
                </span>
              </div>
              <textarea
                id="detect-payload"
                rows={8}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder="Paste any single log line or JSON event to evaluate format matching..."
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
                Clear
              </button>

              <button
                type="submit"
                disabled={detecting || !payload.trim()}
                style={{
                  padding: "0.6rem 1.4rem",
                  backgroundColor: detecting || !payload.trim() ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: detecting || !payload.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                {detecting ? "Evaluating..." : "Run Detection →"}
              </button>
            </div>
          </form>
        </Card>

        {/* Results Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card
            title="Detection Results"
            subtitle="Engine output & match confidence"
          >
            {result ? (
              <div>
                {/* Result Status Header */}
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: isMatched ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${isMatched ? "#bbf7d0" : "#fecaca"}`,
                    borderRadius: "8px",
                    marginBottom: "1.25rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280" }}>
                      Detected Format
                    </span>
                    <Badge variant={isMatched ? "success" : "danger"}>
                      {isMatched ? "Match Identified" : "Unknown Format"}
                    </Badge>
                  </div>

                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: isMatched ? "#15803d" : "#b91c1c", letterSpacing: "0.025em" }}>
                    {result.format.toUpperCase()}
                  </div>

                  {/* Confidence Meter */}
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.35rem" }}>
                      <span style={{ color: "#4b5563", fontWeight: 600 }}>Confidence Score</span>
                      <span style={{ fontWeight: 700, color: isMatched ? "#15803d" : "#b91c1c" }}>
                        {confidencePercent}% ({result.confidence})
                      </span>
                    </div>
                    <div
                      style={{
                        height: "8px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "9999px",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${confidencePercent}%`,
                          backgroundColor: isMatched ? "#22c55e" : "#ef4444",
                          borderRadius: "9999px",
                          transition: "width 0.3s ease"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Next Steps */}
                {isMatched ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                    <Link
                      to={ROUTES.PARSER_DETAIL(result.format)}
                      style={{
                        padding: "0.5rem 0.8rem",
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        textAlign: "center"
                      }}
                    >
                      Test with {result.format.toUpperCase()} Parser Sandbox →
                    </Link>

                    <Link
                      to={ROUTES.INGEST}
                      style={{
                        padding: "0.5rem 0.8rem",
                        backgroundColor: "#f9fafb",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        textAlign: "center"
                      }}
                    >
                      Send to Ingestion Portal →
                    </Link>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.825rem", color: "#6b7280", lineHeight: 1.5, marginBottom: "1rem" }}>
                    None of the active parser plugins recognized this payload. You can add a new parser
                    plugin in <code>Backend/plugins/parsers/</code> to support this format.
                  </div>
                )}

                {/* Raw API Response */}
                <JsonViewer data={result} title="Detector Response Body" maxHeight={220} />
              </div>
            ) : (
              <div
                style={{
                  padding: "2.5rem 1rem",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "0.875rem"
                }}
              >
                Enter a log string and click "Run Detection" to evaluate format recognition.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DetectionPage;
