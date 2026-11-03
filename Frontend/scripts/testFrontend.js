import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeApiError } from "../src/utils/errorHandler.js";
import { ROUTES } from "../src/constants/routes.js";
import { getHealth } from "../src/api/healthApi.js";
import { getParsers, getParserById, reloadParsers, testParser } from "../src/api/parsersApi.js";
import { detectFormat } from "../src/api/detectApi.js";
import { ingestEvent, getEvents } from "../src/api/eventsApi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, "../src");

async function runTests() {
  console.log("==================================================");
  console.log("       ULPF FRONTEND COMPREHENSIVE TEST SUITE     ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}\n`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}\n`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 1: Route Constants & Dynamic Builders
  // ----------------------------------------------------
  console.log("--- 1. Route Constants & URL Builders ---");
  test("ROUTES object defines all required application paths", () => {
    assert.equal(ROUTES.DASHBOARD, "/");
    assert.equal(ROUTES.EVENTS, "/events");
    assert.equal(ROUTES.INGEST, "/ingest");
    assert.equal(ROUTES.DETECT, "/detect");
    assert.equal(ROUTES.PARSERS, "/parsers");
    assert.equal(ROUTES.NOT_FOUND, "*");
  });

  test("ROUTES.EVENT_DETAIL builds dynamic event URLs correctly", () => {
    const url = ROUTES.EVENT_DETAIL("550e8400-e29b-41d4-a716-446655440000");
    assert.equal(url, "/events/550e8400-e29b-41d4-a716-446655440000");
    assert.equal(ROUTES.EVENT_DETAIL(), "/events/:eventId");
  });

  test("ROUTES.PARSER_DETAIL builds dynamic parser URLs correctly", () => {
    const url = ROUTES.PARSER_DETAIL("syslog");
    assert.equal(url, "/parsers/syslog");
    assert.equal(ROUTES.PARSER_DETAIL(), "/parsers/:parserId");
  });

  // ----------------------------------------------------
  // TEST SUITE 2: API Error Normalizer
  // ----------------------------------------------------
  console.log("\n--- 2. Error Normalization Logic ---");
  test("normalizeApiError handles null/undefined error gracefully", () => {
    const res = normalizeApiError(null);
    assert.equal(res.status, null);
    assert.equal(res.isNetworkError, false);
    assert.equal(typeof res.message, "string");
  });

  test("normalizeApiError formats network failure correctly", () => {
    const mockNetworkErr = {
      isAxiosError: true,
      message: "Network Error",
      response: undefined
    };
    const res = normalizeApiError(mockNetworkErr);
    assert.equal(res.isNetworkError, true);
    assert.equal(res.status, null);
    assert.ok(res.message.includes("Network Error"));
  });

  test("normalizeApiError extracts message from HTTP 400 response body", () => {
    const mockHttpErr = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: "Invalid payload format" }
      }
    };
    const res = normalizeApiError(mockHttpErr);
    assert.equal(res.status, 400);
    assert.equal(res.isNetworkError, false);
    assert.equal(res.message, "Invalid payload format");
  });

  test("normalizeApiError extracts error string from HTTP 404 response", () => {
    const mockHttpErr = {
      isAxiosError: true,
      response: {
        status: 404,
        data: { error: "Parser plugin not found" }
      }
    };
    const res = normalizeApiError(mockHttpErr);
    assert.equal(res.status, 404);
    assert.equal(res.message, "Parser plugin not found");
  });

  test("normalizeApiError handles standard JS Error instance", () => {
    const err = new Error("Unexpected reference error");
    const res = normalizeApiError(err);
    assert.equal(res.status, null);
    assert.equal(res.message, "Unexpected reference error");
  });

  // ----------------------------------------------------
  // TEST SUITE 3: Live Backend API Integration
  // ----------------------------------------------------
  console.log("\n--- 3. Live Backend Contract Integration ---");

  await testAsync("GET /api/health -> healthApi.getHealth()", async () => {
    const health = await getHealth();
    assert.ok(health, "Health response must exist");
    assert.equal(health.status, "ok");
    assert.ok(health.service);
  });

  await testAsync("GET /api/v1/parsers -> parsersApi.getParsers()", async () => {
    const res = await getParsers();
    assert.equal(res.success, true);
    assert.ok(Array.isArray(res.parsers), "Parsers must be an array");
    assert.ok(res.parsers.length >= 4, "Must have at least 4 default parsers");

    const ids = res.parsers.map((p) => p.id);
    assert.ok(ids.includes("json"), "Must include json parser");
    assert.ok(ids.includes("syslog"), "Must include syslog parser");
    assert.ok(ids.includes("cef"), "Must include cef parser");
    assert.ok(ids.includes("leef"), "Must include leef parser");
  });

  await testAsync("GET /api/v1/parsers/:id -> parsersApi.getParserById('json')", async () => {
    const res = await getParserById("json");
    assert.equal(res.success, true);
    assert.ok(res.parser);
    assert.equal(res.parser.id, "json");
    assert.ok(Array.isArray(res.parser.formats));
    assert.ok(res.parser.formats.includes("json"));
    assert.equal(res.parser.enabled, true);
  });

  await testAsync("POST /api/v1/parsers/:id/test -> parsersApi.testParser('json')", async () => {
    const samplePayload = JSON.stringify({
      timestamp: "2026-11-02T12:00:00Z",
      host: "test-srv",
      action: "login",
      level: "info"
    });

    const res = await testParser("json", samplePayload);
    assert.equal(res.success, true);
    assert.equal(res.parser_id, "json");
    assert.ok(res.data);
    assert.equal(res.data.source?.name, "test-srv");
    assert.equal(res.data.event?.action, "login");
  });

  await testAsync("POST /api/v1/detect -> detectApi.detectFormat() for JSON", async () => {
    const sample = '{"action":"test","service":"auth"}';
    const res = await detectFormat(sample);
    assert.equal(res.success, true);
    assert.equal(res.format, "json");
    assert.ok(res.confidence >= 0.9);
  });

  await testAsync("POST /api/v1/detect -> detectApi.detectFormat() for Syslog RFC 5424", async () => {
    const sample = "<34>1 2026-11-02T12:00:00Z firewall-edge-01 kernel - - - DROP packet";
    const res = await detectFormat(sample);
    assert.equal(res.success, true);
    assert.equal(res.format, "syslog");
    assert.ok(res.confidence >= 0.9);
  });

  await testAsync("POST /api/v1/detect -> detectApi.detectFormat() for CEF", async () => {
    const sample = "CEF:0|Security|Firewall|1.0|100|Drop packet|8|src=192.168.1.50 dst=10.0.0.1";
    const res = await detectFormat(sample);
    assert.equal(res.success, true);
    assert.equal(res.format, "cef");
    assert.ok(res.confidence >= 0.9);
  });

  await testAsync("POST /api/v1/detect -> detectApi.detectFormat() for LEEF", async () => {
    const sample = "LEEF:1.0|Microsoft|AD|2022|4624|src=10.0.0.5\tdst=10.0.0.1\taction=logon";
    const res = await detectFormat(sample);
    assert.equal(res.success, true);
    assert.equal(res.format, "leef");
    assert.ok(res.confidence >= 0.9);
  });

  await testAsync("POST /api/v1/detect -> detectApi.detectFormat() for Unrecognized Text", async () => {
    const sample = "PLAIN_TEXT_NON_LOG_RANDOM_STRING_12345";
    const res = await detectFormat(sample);
    assert.equal(res.success, true);
    assert.equal(res.format, "unknown");
    assert.equal(res.confidence, 0);
  });

  await testAsync("POST /api/v1/events -> eventsApi.ingestEvent() [Async / HTTP 202]", async () => {
    const eventPayload = {
      source: "frontend_test_runner",
      payload: JSON.stringify({
        timestamp: new Date().toISOString(),
        host: "frontend-suite",
        action: "self_test",
        level: "debug",
        message: "Automated frontend verification test event"
      })
    };

    const res = await ingestEvent(eventPayload);
    assert.equal(res.success, true);
    assert.equal(res.status, "accepted");
    assert.ok(res.message);
  });

  await testAsync("GET /api/v1/events -> eventsApi.getEvents() [Search & Pagination]", async () => {
    const res = await getEvents({ limit: 5 });
    assert.equal(res.success, true);
    assert.ok(res.data);
    assert.equal(typeof res.data.total, "number");
    assert.equal(typeof res.data.page, "number");
    assert.ok(Array.isArray(res.data.events));
  });

  await testAsync("POST /api/v1/parsers/reload -> parsersApi.reloadParsers()", async () => {
    const res = await reloadParsers();
    assert.equal(res.success, true);
    assert.ok(res.summary);
    assert.ok(res.summary.loaded >= 4);
    assert.ok(Array.isArray(res.parsers));
  });

  // ----------------------------------------------------
  // TEST SUITE 4: Component Files & Export Integrity
  // ----------------------------------------------------
  console.log("\n--- 4. Component Structure & Export Integrity ---");

  const requiredComponents = [
    { file: "components/common/Badge.jsx", expectedExport: "export function Badge" },
    { file: "components/common/Card.jsx", expectedExport: "export function Card" },
    { file: "components/common/ErrorAlert.jsx", expectedExport: "export function ErrorAlert" },
    { file: "components/common/LoadingSpinner.jsx", expectedExport: "export function LoadingSpinner" },
    { file: "components/common/JsonViewer.jsx", expectedExport: "export function JsonViewer" },
    { file: "components/layout/Header.jsx", expectedExport: "export function Header" },
    { file: "components/layout/Sidebar.jsx", expectedExport: "export function Sidebar" },
    { file: "components/layout/HealthBadge.jsx", expectedExport: "export function HealthBadge" },
    { file: "layouts/AppLayout.jsx", expectedExport: "export function AppLayout" },
    { file: "pages/Dashboard/DashboardPage.jsx", expectedExport: "export function DashboardPage" },
    { file: "pages/Ingest/IngestPage.jsx", expectedExport: "export function IngestPage" },
    { file: "pages/Detection/DetectionPage.jsx", expectedExport: "export function DetectionPage" },
    { file: "pages/Parsers/ParsersPage.jsx", expectedExport: "export function ParsersPage" },
    { file: "pages/Parsers/ParserDetailPage.jsx", expectedExport: "export function ParserDetailPage" },
    { file: "pages/Events/EventsPage.jsx", expectedExport: "export function EventsPage" },
    { file: "pages/Events/EventDetailPage.jsx", expectedExport: "export function EventDetailPage" },
    { file: "pages/NotFound/NotFoundPage.jsx", expectedExport: "export function NotFoundPage" },
    { file: "routes/AppRoutes.jsx", expectedExport: "export function AppRoutes" }
  ];

  for (const comp of requiredComponents) {
    await testAsync(`Component file '${comp.file}' exists and exports correctly`, async () => {
      const fullPath = path.join(SRC_DIR, comp.file);
      const content = await fs.readFile(fullPath, "utf-8");
      assert.ok(content.length > 50, `File ${comp.file} must not be empty`);
      assert.ok(content.includes(comp.expectedExport), `File ${comp.file} must contain ${comp.expectedExport}`);
    });
  }

  // ----------------------------------------------------
  // TEST SUMMARY
  // ----------------------------------------------------
  console.log("\n==================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution encountered an unexpected fatal error:", err);
  process.exit(1);
});
