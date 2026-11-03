# Universal Log Pre-processing Framework (ULPF) — Backend

The **Universal Log Pre-processing Framework (ULPF)** Backend is a high-throughput, plug-and-play event ingestion, format detection, normalization, cryptographic verification, and search indexing engine designed for security operations, observability, and compliance log pipelines.

---

## Table of Contents

- [1. Architecture Overview](#1-architecture-overview)
- [2. End-to-End Processing Pipeline](#2-end-to-end-processing-pipeline)
- [3. Key Architectural Features](#3-key-architectural-features)
- [4. Plug-and-Play Parser Plugin System](#4-plug-and-play-parser-plugin-system)
  - [4.1 Architecture Principles](#41-architecture-principles)
  - [4.2 Plugin Directory Layout](#42-plugin-directory-layout)
  - [4.3 Manifest Specification (`manifest.json`)](#43-manifest-specification-manifestjson)
  - [4.4 Parser Implementation (`parser.js`)](#44-parser-implementation-parserjs)
  - [4.5 Adding a New Parser Plugin (Step-by-Step)](#45-adding-a-new-parser-plugin-step-by-step)
  - [4.6 Supported Out-of-the-Box Parsers](#46-supported-out-of-the-box-parsers)
- [5. Cryptographic Integrity & Raw Archival](#5-cryptographic-integrity--raw-archival)
- [6. HTTP REST API Reference](#6-http-rest-api-reference)
  - [6.1 Health Check](#61-health-check)
  - [6.2 Parser Plugin Management](#62-parser-plugin-management)
  - [6.3 Format Auto-Detection](#63-format-auto-detection)
  - [6.4 Event Ingestion & Querying](#64-event-ingestion--querying)
- [7. Directory Structure](#7-directory-structure)
- [8. Infrastructure & Prerequisites](#8-infrastructure--prerequisites)
- [9. Configuration & Environment Variables](#9-configuration--environment-variables)
- [10. Setup & Execution](#10-setup--execution)

---

## 1. Architecture Overview

```text
                       +------------------------------------------+
                       |              HTTP Clients                |
                       |       (Frontend UI / Log Agents)         |
                       +--------------------+---------------------+
                                            |
                                            | HTTP REST API (Port 5000)
                                            v
                       +------------------------------------------+
                       |          Express.js API Gateway          |
                       |   (/api/v1/events, /parsers, /detect)    |
                       +--------------------+---------------------+
                                            |
                                            | AMQP Publish
                                            v
                       +------------------------------------------+
                       |           RabbitMQ Event Queue           |
                       |        (Exchange: ulpf.events)           |
                       +--------------------+---------------------+
                                            |
                                            | Worker Consumer
                                            v
                       +------------------------------------------+
                       |            Event Worker Daemon           |
                       |         (Src/workers/eventWorker.js)     |
                       +--------------------+---------------------+
                                            |
                                            v
                       +------------------------------------------+
                       |         Event Processing Engine          |
                       |                                          |
                       | 1. SHA-256 Hash Generation               |
                       | 2. Raw Log Archival -> MinIO             |
                       | 3. Dynamic Format Detection              |
                       | 4. Plug-and-Play Parser Execution        |
                       | 5. Universal Schema Normalization        |
                       | 6. Zod Schema Validation                 |
                       +-------------+----------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+-------------------------------+           +-------------------------------+
|      MinIO Object Storage     |           |     OpenSearch Search Node    |
|   Bucket: `ulpf-raw-events`   |           |     Index: `ulpf-events`      |
|  (Immutable Raw Log + SHA256) |           |  (Normalized & Filterable)    |
+-------------------------------+           +-------------------------------+
```

---

## 2. End-to-End Processing Pipeline

1. **HTTP Ingestion (`POST /api/v1/events`):**
   Incoming payloads are accepted, tagged with ingestion metadata (`received_at`, `source`), and queued onto RabbitMQ. The client receives an immediate `202 Accepted` response.
2. **RabbitMQ Decoupling:**
   Protects downstream storage and indexing services from traffic bursts. Events are held in durable queues (`ulpf.events`).
3. **Worker Processing (`eventWorker.js`):**
   The consumer extracts each message and dispatches it to the processing pipeline (`eventProcessor.js`).
4. **Raw Archival & SHA-256 Hashing:**
   The exact unparsed payload is hashed using SHA-256 and uploaded to an immutable MinIO bucket (`ulpf-raw-events/<YYYY-MM-DD>/<eventId>.json`).
5. **Format Detection:**
   If no explicit format is provided, the payload is dynamically tested against all enabled parser plugins in `formatDetector.js`.
6. **Parser Execution:**
   The registered plugin transforms the raw text into structured attributes using `parserRunner.js`.
7. **Canonical Normalization:**
   `eventNormalizer.js` maps vendor fields into the ULPF canonical data model (`event_id`, `timestamp`, `source`, `event`, `network`, `user`, `raw`).
8. **Zod Validation:**
   The normalized event is strictly validated against `UniversalEventSchema.js`.
9. **OpenSearch Indexing:**
   The validated event is indexed into OpenSearch (`ulpf-events`) for fast retrieval, search, and filtering.

---

## 3. Key Architectural Features

- **Asynchronous Ingestion Decoupling:** Uses RabbitMQ for durable buffering, enabling high ingestion throughput without blocking callers.
- **True Plug-and-Play Extensibility:** Parsers are isolated plugins with independent manifests and logic. Zero core engine changes are required to add or disable formats.
- **Cryptographic Auditability:** Every log event is hashed (SHA-256) at ingestion. Stored hashes are verified against the raw storage object on demand.
- **Strict Canonical Schema:** Standardizes disparate log syntaxes (Syslog, JSON, CEF, LEEF) into a unified Elastic Common Schema (ECS)-aligned format.
- **Full-Text & Parametric Search:** Powered by OpenSearch with support for date ranges, exact term matching, full-text queries, and paginated results.

---

## 4. Plug-and-Play Parser Plugin System

The parser subsystem operates like modular software packages. The core pipeline has **zero hardcoded imports** for individual parsers.

### 4.1 Architecture Principles

- **Automatic Discovery:** The `PluginManager` scans `Backend/plugins/parsers/` on boot and loads all valid plugins.
- **Hot Reloading:** Calling `POST /api/v1/parsers/reload` refreshes installed plugins without restarting the server process.
- **Validation:** Plugins must supply a valid `manifest.json` complying with API specification `v1.0`.
- **Dry-Run Testing:** Parsers can be tested in isolation (`POST /api/v1/parsers/:id/test`) without writing to RabbitMQ, MinIO, or OpenSearch.

### 4.2 Plugin Directory Layout

Each plugin is self-contained within its own directory:

```text
Backend/plugins/parsers/
├── json/
│   ├── manifest.json
│   └── parser.js
├── syslog/
│   ├── manifest.json
│   └── parser.js
├── cef/
│   ├── manifest.json
│   └── parser.js
└── leef/
    ├── manifest.json
    └── parser.js
```

### 4.3 Manifest Specification (`manifest.json`)

```json
{
  "id": "json",
  "name": "JSON Parser",
  "version": "1.0.0",
  "description": "Parser for JSON formatted application logs",
  "type": "parser",
  "apiVersion": "1.0",
  "formats": ["json"],
  "entry": "parser.js",
  "enabled": true
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (e.g. `json`, `syslog`, `custom_firewall`) |
| `name` | `string` | Human-readable name of the parser |
| `version` | `string` | Semantic version string |
| `description` | `string` | Summary of parser capabilities |
| `type` | `string` | Must be `"parser"` |
| `apiVersion` | `string` | Target framework API version (`"1.0"`) |
| `formats` | `string[]` | Formats handled by this parser |
| `entry` | `string` | Entry point file relative to plugin folder (e.g. `"parser.js"`) |
| `enabled` | `boolean` | Set `false` to disable without deleting files |

### 4.4 Parser Implementation (`parser.js`)

Each plugin entry point must export:
1. `detect(payload)`: Evaluates whether a raw string matches this format. Returns `{ match: boolean, confidence: number }` or a boolean.
2. `parse(payload)`: Extracts fields from the raw payload into intermediate structured attributes.

```javascript
/**
 * Detects if the payload matches the format
 * @param {string} payload
 * @returns {{ match: boolean, confidence: number }}
 */
export function detect(payload) {
    if (payload.trim().startsWith("{") && payload.trim().endsWith("}")) {
        return { match: true, confidence: 0.95 };
    }
    return { match: false, confidence: 0 };
}

/**
 * Parses raw text into structured attributes
 * @param {string} payload
 * @returns {object}
 */
export function parse(payload) {
    const data = JSON.parse(payload);
    return {
        timestamp: data.timestamp || new Date().toISOString(),
        source: {
            name: data.host || "unknown",
            type: "application"
        },
        event: {
            action: data.action,
            category: data.category || "general",
            severity: String(data.level || "info")
        },
        message: data.message
    };
}
```

### 4.5 Adding a New Parser Plugin (Step-by-Step)

To add a new parser (e.g., Apache Access Logs):

1. Create a directory: `Backend/plugins/parsers/apache/`
2. Create `Backend/plugins/parsers/apache/manifest.json`:
   ```json
   {
     "id": "apache",
     "name": "Apache Access Log Parser",
     "version": "1.0.0",
     "description": "Parser for Common Log Format (CLF) access logs",
     "type": "parser",
     "apiVersion": "1.0",
     "formats": ["apache"],
     "entry": "parser.js",
     "enabled": true
   }
   ```
3. Implement `Backend/plugins/parsers/apache/parser.js` exporting `detect` and `parse`.
4. Trigger reload via API:
   ```bash
   curl -X POST http://localhost:5000/api/v1/parsers/reload
   ```
5. The Apache parser is instantly loaded and active across detection and ingestion without server downtime.

### 4.6 Supported Out-of-the-Box Parsers

- **`json`**: Structured JSON log events, application traces, cloud audits.
- **`syslog`**: Standard RFC 3164 (BSD) and RFC 5424 syslog messages.
- **`cef`**: ArcSight Common Event Format logs (`CEF:0|Vendor|Product|Version|ID|Name|Severity|Extension`).
- **`leef`**: IBM QRadar Log Event Extended Format (`LEEF:1.0|Vendor|Product|Version|EventID|Extension`).

---

## 5. Cryptographic Integrity & Raw Archival

For compliance, forensic investigation, and tamper-detection, raw logs are preserved verbatim:

1. **Storage Path:** `ulpf-raw-events/YYYY-MM-DD/<eventId>.json` in MinIO.
2. **SHA-256 Digest:** Calculated across the exact UTF-8 byte stream before parsing or normalization.
3. **Audit Verification Endpoint:**
   `GET /api/v1/events/:eventId/raw` retrieves the raw object, recalculates the SHA-256 hash in real-time, compares it with the immutable digest in OpenSearch, and returns `verified: true/false`.

---

## 6. HTTP REST API Reference

All endpoints return JSON responses with standard HTTP status codes.

### 6.1 Health Check

#### `GET /api/health`
Checks backend liveness and basic system status.

- **Request:** None
- **Response `200 OK`:**
  ```json
  {
    "status": "ok",
    "service": "ULPF Backend",
    "environment": "development"
  }
  ```

---

### 6.2 Parser Plugin Management

#### `GET /api/v1/parsers`
Lists all discovered and installed parser plugins.

- **Request:** None
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "parsers": [
      {
        "id": "json",
        "name": "JSON Parser",
        "version": "1.0.0",
        "description": "Parser for JSON formatted application logs",
        "type": "parser",
        "apiVersion": "1.0",
        "formats": ["json"],
        "enabled": true
      }
    ]
  }
  ```

#### `GET /api/v1/parsers/:id`
Retrieves detailed metadata for a single parser plugin.

- **Path Parameters:** `id` (e.g. `syslog`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "parser": {
      "id": "syslog",
      "name": "Syslog Parser",
      "version": "1.0.0",
      "formats": ["syslog"],
      "enabled": true
    }
  }
  ```
- **Response `404 Not Found`:** When the specified parser ID is not installed.

#### `POST /api/v1/parsers/reload`
Rescans the plugin directory and reloads all manifests and modules.

- **Request Body:** None
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Parser plugins reloaded successfully",
    "summary": { "loaded": 4, "disabled": 0, "failed": 0 },
    "parsers": [ ... ]
  }
  ```

#### `POST /api/v1/parsers/:id/test`
Performs a dry-run test of a parser against a sample payload without writing to RabbitMQ, MinIO, or OpenSearch.

- **Path Parameters:** `id` (e.g. `json`)
- **Request Body:**
  ```json
  {
    "payload": "{\"host\":\"web-01\",\"action\":\"login\",\"level\":\"info\"}"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "parser_id": "json",
    "data": {
      "timestamp": "2026-11-02T00:00:00.000Z",
      "source": { "name": "web-01", "type": "application" },
      "event": { "action": "login", "severity": "info" }
    }
  }
  ```

---

### 6.3 Format Auto-Detection

#### `POST /api/v1/detect`
Tests a raw log string against all currently enabled parser plugins to determine the format.

- **Request Body:**
  ```json
  {
    "payload": "<34>1 2026-11-01T22:14:15.003Z server01 app - - - Authentication success"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "format": "syslog",
    "confidence": 1.0,
    "data": {
      "format": "syslog",
      "confidence": 1.0
    }
  }
  ```

---

### 6.4 Event Ingestion & Querying

#### `POST /api/v1/events`
Queues a raw log event for asynchronous processing.

- **Request Body:**
  ```json
  {
    "source": "firewall-gw-01",
    "format": "cef",
    "payload": "CEF:0|Security|Firewall|1.0|100|Drop packet|8|src=192.168.1.50 dst=10.0.0.1"
  }
  ```
  *(Note: `format` is optional; if omitted, format auto-detection is performed automatically).*
- **Response `202 Accepted`:**
  ```json
  {
    "success": true,
    "status": "accepted",
    "message": "Event accepted for processing"
  }
  ```

#### `GET /api/v1/events`
Searches, filters, and paginates normalized events in OpenSearch.

- **Query Parameters:**
  - `query` (string): Full-text search across `message`, `source.name`, `event.action`, `event.category`.
  - `source` (string): Exact match on `source.name`.
  - `format` (string): Exact match on `raw.format` (`json`, `syslog`, `cef`, `leef`).
  - `category` (string): Exact match on `event.category` (e.g. `authentication`, `network`).
  - `severity` (string): Exact match on `event.severity` (e.g. `1`, `info`, `high`).
  - `from` (ISO date string): Lower bound timestamp.
  - `to` (ISO date string): Upper bound timestamp.
  - `page` (number, default: 1): Page index.
  - `limit` (number, default: 20, max: 100): Page size.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "total": 142,
      "page": 1,
      "limit": 20,
      "totalPages": 8,
      "events": [
        {
          "event_id": "c1f7a4d5-88e2-45e0-9bc8-8f8303f271ec",
          "timestamp": "2026-11-01T22:14:15.003Z",
          "received_at": "2026-11-01T22:14:15.110Z",
          "source": { "name": "firewall-gw-01", "type": "network" },
          "event": { "category": "network", "action": "Drop packet", "severity": "8" },
          "raw": {
            "format": "cef",
            "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
            "storage": { "bucket": "ulpf-raw-events", "object": "2026-11-01/c1f7a4d5.json" }
          }
        }
      ]
    }
  }
  ```

#### `GET /api/v1/events/:eventId`
Retrieves a single normalized event by ID.

- **Path Parameters:** `eventId` (UUID)
- **Response `200 OK`:** Event document object.
- **Response `404 Not Found`:** When the event does not exist in OpenSearch.

#### `GET /api/v1/events/:eventId/raw`
Retrieves the original archived raw log and executes cryptographic integrity verification.

- **Path Parameters:** `eventId` (UUID)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "event_id": "c1f7a4d5-88e2-45e0-9bc8-8f8303f271ec",
      "bucket": "ulpf-raw-events",
      "object": "2026-11-01/c1f7a4d5.json",
      "sha256": {
        "stored": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
        "calculated": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
        "verified": true
      },
      "raw_event": {
        "event_id": "c1f7a4d5-88e2-45e0-9bc8-8f8303f271ec",
        "source": "firewall-gw-01",
        "format": "cef",
        "payload": "CEF:0|Security|Firewall|1.0|100|Drop packet|8|src=192.168.1.50 dst=10.0.0.1",
        "received_at": "2026-11-01T22:14:15.110Z"
      }
    }
  }
  ```

---

## 7. Directory Structure

```text
Backend/
├── .env.development              # Environment variable definitions
├── package.json                  # Dependencies & start scripts
├── plugins/
│   └── parsers/                  # Dedicated parser plugins folder
│       ├── cef/                  # CEF parser plugin
│       ├── json/                 # JSON parser plugin
│       ├── leef/                 # LEEF parser plugin
│       └── syslog/               # Syslog parser plugin
└── Src/
    ├── server.js                 # Express server & worker initializer
    ├── config/
    │   ├── env.js                # Environment schema validation
    │   ├── minio.js              # MinIO client & bucket initialization
    │   ├── opensearch.js         # OpenSearch client & index mapping
    │   └── rabbitmq.js           # RabbitMQ connection & channel setup
    ├── controllers/
    │   ├── detectController.js   # Format auto-detection controller
    │   ├── eventController.js    # Ingest, search, & raw audit controller
    │   └── parserController.js   # Plugin management & dry-run test controller
    ├── core/
    │   └── plugins/
    │       ├── parserRunner.js   # Isolated parser execution runtime
    │       ├── pluginLoader.js   # Plugin directory & manifest validator
    │       ├── pluginManager.js  # Plugin discovery & lifecycle manager
    │       └── pluginRegistry.js # In-memory active plugin registry
    ├── detectors/
    │   └── formatDetector.js     # Universal format detector
    ├── normalizers/
    │   └── eventNormalizer.js    # Canonical ECS event model mapper
    ├── queues/
    │   └── eventProducer.js      # RabbitMQ event publisher
    ├── routes/
    │   ├── detectRoutes.js       # /api/v1/detect routes
    │   ├── eventRoutes.js        # /api/v1/events routes
    │   └── parserRoutes.js       # /api/v1/parsers routes
    ├── schemas/
    │   └── universalEvent.js     # Canonical event Zod schema
    ├── services/
    │   ├── eventProcessor.js     # Orchestration of parse/store/index pipeline
    │   ├── eventSearchService.js # OpenSearch query builder & search service
    │   ├── eventSearchStorage.js # OpenSearch document indexing
    │   └── rawEventStorage.js    # MinIO storage & SHA-256 calculation
    └── workers/
        └── eventWorker.js        # RabbitMQ consumer daemon
```

---

## 8. Infrastructure & Prerequisites

The backend requires the following external services:

1. **Node.js**: `v18.0.0` or higher (ES Modules enabled).
2. **RabbitMQ**: AMQP 0-9-1 broker running on port `5672`.
3. **MinIO / S3 Object Storage**: Running on port `9000`.
4. **OpenSearch**: Running on port `9200`.

---

## 9. Configuration & Environment Variables

Configure `.env.development` or `.env.production` in the `Backend/` directory:

```env
NODE_ENV=development
PORT=5000

# RabbitMQ
RABBITMQ_URL=amqp://admin:password@localhost:5672
RABBITMQ_QUEUE=ulpf.events

# OpenSearch
OPENSEARCH_URL=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=YourSecurePassword

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=YourMinioKey
MINIO_SECRET_KEY=YourMinioSecret

# Allowed CORS Frontend Origin
FRONTEND_URL=http://localhost:5173
```

---

## 10. Setup & Execution

### 10.1 Install Dependencies
```bash
cd Backend
npm install
```

### 10.2 Run in Development Mode
```bash
npm run dev
```

The server will automatically:
1. Scan and register all plugins in `Backend/plugins/parsers/`.
2. Connect to RabbitMQ and declare the `ulpf.events` exchange and queue.
3. Verify or create the `ulpf-raw-events` bucket in MinIO.
4. Verify or create the `ulpf-events` index mapping in OpenSearch.
5. Launch the RabbitMQ event consumer worker.
6. Bind Express to `http://localhost:5000`.

### 10.3 Verify System Health
```bash
curl http://localhost:5000/api/health
```
Expected output:
```json
{"status":"ok","service":"ULPF Backend","environment":"development"}
```
