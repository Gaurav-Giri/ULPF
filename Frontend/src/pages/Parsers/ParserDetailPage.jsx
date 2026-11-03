import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getParserById, testParser } from "../../api/parsersApi.js";
import { Card } from "../../components/common/Card.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { ErrorAlert } from "../../components/common/ErrorAlert.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { JsonViewer } from "../../components/common/JsonViewer.jsx";
import { ROUTES } from "../../constants/routes.js";

const DEFAULT_SAMPLES = {
  json: JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      hostname: "web-prod-01",
      source_type: "application",
      vendor: "Nginx",
      category: "web_traffic",
      action: "http_get",
      level: "info",
      src_ip: "203.0.113.88",
      dst_ip: "10.0.1.10",
      src_port: 52110,
      dst_port: 443,
      protocol: "tcp",
      message: "GET /api/v1/health HTTP/1.1 200 OK"
    },
    null,
    2
  ),
  syslog: `<34>1 ${new Date().toISOString()} core-router-01 kernel - - - BLOCK src=192.168.1.100 dst=10.0.0.1 port=23 protocol=tcp Telnet probe blocked`,
  cef: `CEF:0|Fortinet|FortiGate|7.0.2|00001|Traffic Accept|3|src=192.168.10.15 dst=172.16.5.1 spt=49200 dpt=443 proto=tcp dvchost=fw01.internal msg="Allowed HTTPS session"`,
  leef: `LEEF:1.0|PaloAlto|PAN-OS|10.0|TRAFFIC|devName=pa500.internal\tsrc=10.2.1.50\tdst=8.8.8.8\tspt=53120\tdpt=53\tproto=udp\taction=allow\tseverity=1\tmsg=DNS query allowed`
};

export function ParserDetailPage() {
  const { parserId } = useParams();
  const [parser, setParser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sandbox state
  const [payload, setPayload] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  const fetchParser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getParserById(parserId);
      setParser(response.parser);

      // Preload tailored sample if empty
      const defaultSample = DEFAULT_SAMPLES[parserId.toLowerCase()];
      if (defaultSample) {
        setPayload(defaultSample);
      }
    } catch (err) {
      setError(err);
      setParser(null);
    } finally {
      setLoading(false);
    }
  }, [parserId]);

  useEffect(() => {
    fetchParser();
  }, [fetchParser]);

  const loadDefaultSample = () => {
    const sample = DEFAULT_SAMPLES[parserId.toLowerCase()];
    if (sample) {
      setPayload(sample);
      setTestError(null);
      setTestResult(null);
    }
  };

  const handleTest = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!payload.trim()) {
      setTestError({ message: "Payload cannot be empty. Enter a raw log sample to test." });
      return;
    }

    setTesting(true);
    setTestError(null);
    try {
      const response = await testParser(parserId, payload.trim());
      setTestResult(response);
    } catch (err) {
      setTestError(err);
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to={ROUTES.PARSERS} style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>
            ← Back to Parsers Catalog
          </Link>
        </div>
        <LoadingSpinner message={`Loading parser plugin '${parserId}'...`} />
      </div>
    );
  }

  if (error || !parser) {
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to={ROUTES.PARSERS} style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>
            ← Back to Parsers Catalog
          </Link>
        </div>
        <ErrorAlert
          error={error || { message: `Parser plugin '${parserId}' was not found.` }}
          onRetry={fetchParser}
          title="Parser Not Found"
        />
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to={ROUTES.PARSERS}
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
          ← Back to Parsers Catalog
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>
              {parser.name}
            </h1>
            <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.9rem" }}>
              Plugin ID: <code style={{ color: "#2563eb" }}>{parser.id}</code>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Badge variant={parser.enabled ? "success" : "neutral"}>
              {parser.enabled ? `Enabled (v${parser.version})` : "Disabled"}
            </Badge>
            <Badge variant="info">API v{parser.apiVersion}</Badge>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Left Column: Metadata Specifications */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card title="Plugin Specification" subtitle="Manifest metadata">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#6b7280", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>Description</span>
                <span style={{ color: "#1f2937" }}>{parser.description || "No description provided."}</span>
              </div>

              <div>
                <span style={{ color: "#6b7280", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>Plugin Type</span>
                <code>{parser.type}</code>
              </div>

              <div>
                <span style={{ color: "#6b7280", display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>Supported Formats</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                  {parser.formats.map((fmt) => (
                    <Badge key={fmt} variant="info">{fmt}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ color: "#6b7280", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>Status</span>
                <span style={{ fontWeight: 600, color: parser.enabled ? "#15803d" : "#991b1b" }}>
                  {parser.enabled ? "Active in Ingestion Pipeline" : "Disabled (Ignored by engine)"}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Dry-Run Sandbox Notice" subtitle="In-memory execution">
            <div style={{ fontSize: "0.8rem", color: "#4b5563", lineHeight: 1.5 }}>
              <p style={{ margin: "0 0 0.5rem" }}>
                Testing a parser executes its <code>parse()</code> method directly on the backend.
              </p>
              <p style={{ margin: 0 }}>
                This is a <strong>non-destructive dry run</strong>: no messages are published to
                RabbitMQ, no objects are created in MinIO, and no documents are written to OpenSearch.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Sandbox Tester & Result */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card
            title="Interactive Parser Sandbox"
            subtitle={`Dry-run testing POST /api/v1/parsers/${parser.id}/test`}
            extra={
              DEFAULT_SAMPLES[parser.id.toLowerCase()] && (
                <button
                  type="button"
                  onClick={loadDefaultSample}
                  style={{
                    padding: "0.35rem 0.75rem",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 500
                  }}
                >
                  Load Sample
                </button>
              )
            }
          >
            {testError && <ErrorAlert error={testError} onRetry={handleTest} title="Parser Test Failed" />}

            <form onSubmit={handleTest}>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <label htmlFor="parser-test-payload" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                    Sample Input Payload *
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{payload.length} chars</span>
                </div>
                <textarea
                  id="parser-test-payload"
                  rows={7}
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="Enter sample payload to test this parser plugin..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    lineHeight: 1.45,
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setPayload("");
                    setTestResult(null);
                    setTestError(null);
                  }}
                  style={{
                    padding: "0.5rem 0.85rem",
                    backgroundColor: "#f3f4f6",
                    color: "#4b5563",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={testing || !payload.trim()}
                  style={{
                    padding: "0.55rem 1.4rem",
                    backgroundColor: testing || !payload.trim() ? "#93c5fd" : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: testing || !payload.trim() ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600
                  }}
                >
                  {testing ? "Running Parser..." : "Execute Parser →"}
                </button>
              </div>
            </form>
          </Card>

          {/* Test Output Viewer */}
          {testResult && (
            <Card
              title="Normalized Parser Output"
              subtitle={`Extracted attributes from plugin '${testResult.parser_id}'`}
              extra={<Badge variant="success">Parsed Successfully</Badge>}
            >
              <JsonViewer data={testResult.data} title="Parsed Event Object" maxHeight={350} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParserDetailPage;
