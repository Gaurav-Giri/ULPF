import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../../api/eventsApi.js";
import { Card } from "../../components/common/Card.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { ErrorAlert } from "../../components/common/ErrorAlert.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { ROUTES } from "../../constants/routes.js";

export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      page,
      limit
    };

    if (searchQuery.trim()) params.query = searchQuery.trim();
    if (selectedFormat) params.format = selectedFormat;
    if (selectedSeverity) params.severity = selectedSeverity;
    if (sourceFilter.trim()) params.source = sourceFilter.trim();
    if (categoryFilter.trim()) params.category = categoryFilter.trim();
    if (fromDate) params.from = new Date(fromDate).toISOString();
    if (toDate) params.to = new Date(toDate).toISOString();

    try {
      const response = await getEvents(params);
      const data = response.data || {};
      const totalCount = typeof data.total === "number" ? data.total : (data.total?.value || 0);
      const computedTotalPages = data.total_pages || data.totalPages || Math.ceil(totalCount / limit) || 1;
      setEvents(data.events || []);
      setTotal(totalCount);
      setTotalPages(computedTotalPages);
    } catch (err) {
      setError(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedFormat, selectedSeverity, sourceFilter, categoryFilter, fromDate, toDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedFormat("");
    setSelectedSeverity("");
    setSourceFilter("");
    setCategoryFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
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

  const formatTimestamp = (ts) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return !Number.isNaN(d.getTime()) ? d.toLocaleString() : ts;
    } catch {
      return ts;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}>
              Events Explorer
            </h1>
            <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.95rem" }}>
              Search, filter, and inspect normalized events indexed in OpenSearch with MinIO raw storage verification.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={fetchEvents}
              disabled={loading}
              style={{
                padding: "0.5rem 0.9rem",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: loading ? "default" : "pointer",
                fontSize: "0.85rem",
                fontWeight: 500
              }}
            >
              ↻ Refresh
            </button>
            <Link
              to={ROUTES.INGEST}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              + Ingest New Event
            </Link>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <Card title="Search & Parametric Filters" subtitle="Querying GET /api/v1/events">
        <form onSubmit={handleSearchSubmit}>
          {/* Top Row: Full-Text Search */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across message, source name, action, or category..."
              style={{
                flex: 1,
                padding: "0.6rem 0.85rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.6rem 1.25rem",
                backgroundColor: "#1f2937",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem"
              }}
            >
              Search
            </button>
            {(searchQuery || selectedFormat || selectedSeverity || sourceFilter || categoryFilter || fromDate || toDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: "0.6rem 1rem",
                  backgroundColor: "#f3f4f6",
                  color: "#4b5563",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Secondary Row: Specific Filters */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid #f3f4f6"
            }}
          >
            {/* Format Filter */}
            <div>
              <label htmlFor="filter-format" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.2rem" }}>
                Format
              </label>
              <select
                id="filter-format"
                value={selectedFormat}
                onChange={(e) => {
                  setSelectedFormat(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "0.825rem",
                  backgroundColor: "#ffffff"
                }}
              >
                <option value="">All Formats</option>
                <option value="json">JSON</option>
                <option value="syslog">Syslog</option>
                <option value="cef">CEF</option>
                <option value="leef">LEEF</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label htmlFor="filter-severity" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.2rem" }}>
                Severity
              </label>
              <input
                id="filter-severity"
                type="text"
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. info, error, 5"
                style={{
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "0.825rem"
                }}
              />
            </div>

            {/* Source Filter */}
            <div>
              <label htmlFor="filter-source" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.2rem" }}>
                Source Name
              </label>
              <input
                id="filter-source"
                type="text"
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. web-app-01"
                style={{
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "0.825rem"
                }}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="filter-category" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.2rem" }}>
                Category
              </label>
              <input
                id="filter-category"
                type="text"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. network, security"
                style={{
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "0.825rem"
                }}
              />
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="filter-from" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.2rem" }}>
                From Time
              </label>
              <input
                id="filter-from"
                type="datetime-local"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "0.825rem"
                }}
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="filter-to" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.2rem" }}>
                To Time
              </label>
              <input
                id="filter-to"
                type="datetime-local"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "0.825rem"
                }}
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Error Alert */}
      {error && <ErrorAlert error={error} onRetry={fetchEvents} />}

      {/* Events Table / Content Card */}
      <Card
        title="Indexed Events"
        subtitle={`Showing ${events.length} of ${total} total matching events`}
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Per Page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: "0.3rem 0.5rem",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                fontSize: "0.8rem",
                backgroundColor: "#ffffff"
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100 (Max)</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <LoadingSpinner message="Querying OpenSearch cluster..." />
        ) : events.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#6b7280" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 600, color: "#374151" }}>
              No Events Found
            </p>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.875rem" }}>
              There are no logs matching your current search parameters or indexed in OpenSearch yet.
            </p>
            <Link
              to={ROUTES.INGEST}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600
              }}
            >
              Ingest a Sample Event Now →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                  <th style={{ padding: "0.75rem" }}>Timestamp</th>
                  <th style={{ padding: "0.75rem" }}>Source</th>
                  <th style={{ padding: "0.75rem" }}>Format</th>
                  <th style={{ padding: "0.75rem" }}>Category</th>
                  <th style={{ padding: "0.75rem" }}>Action</th>
                  <th style={{ padding: "0.75rem" }}>Severity</th>
                  <th style={{ padding: "0.75rem" }}>Message Snippet</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr
                    key={ev.event_id}
                    style={{ borderBottom: "1px solid #f3f4f6", transition: "background-color 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap", color: "#374151" }}>
                      {formatTimestamp(ev.timestamp)}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "#111827" }}>
                      {ev.source?.name || "unknown"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <Badge variant="info">{ev.raw?.format || "raw"}</Badge>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#4b5563" }}>
                      {ev.event?.category || "—"}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#4b5563" }}>
                      {ev.event?.action || "—"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <Badge variant={getSeverityBadgeVariant(ev.event?.severity)}>
                        {ev.event?.severity || "none"}
                      </Badge>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        maxWidth: "240px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#4b5563"
                      }}
                      title={ev.message}
                    >
                      {ev.message || "—"}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <Link
                        to={ROUTES.EVENT_DETAIL(ev.event_id)}
                        style={{
                          padding: "0.35rem 0.75rem",
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          borderRadius: "4px",
                          textDecoration: "none",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          whiteSpace: "nowrap"
                        }}
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid #f3f4f6",
              fontSize: "0.85rem",
              color: "#6b7280",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total logs)
            </span>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                style={{
                  padding: "0.4rem 0.8rem",
                  backgroundColor: page <= 1 ? "#f3f4f6" : "#ffffff",
                  color: page <= 1 ? "#9ca3af" : "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontSize: "0.825rem",
                  fontWeight: 500
                }}
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                style={{
                  padding: "0.4rem 0.8rem",
                  backgroundColor: page >= totalPages ? "#f3f4f6" : "#ffffff",
                  color: page >= totalPages ? "#9ca3af" : "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.825rem",
                  fontWeight: 500
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default EventsPage;
