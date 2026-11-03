# Universal Log Pre-processing Framework (ULPF) — Frontend

The **Universal Log Pre-processing Framework (ULPF)** Frontend is a responsive single-page web application built with **React 19**, **Vite**, **React Router 7**, and **Axios**.

It provides security analysts and DevOps engineers with an operational interface to monitor pipeline health, inspect installed parser plugins, test format auto-detection, simulate log ingestion, and search normalized event records with cryptographic integrity verification.

---

## Table of Contents

- [1. Overview & Key Capabilities](#1-overview--key-capabilities)
- [2. Architectural Principles](#2-architectural-principles)
- [3. Application Route Map](#3-application-route-map)
- [4. API Client & Service Layer](#4-api-client--service-layer)
  - [4.1 Centralized Axios Client & Interceptor](#41-centralized-axios-client--interceptor)
  - [4.2 Normalized Error Handling](#42-normalized-error-handling)
  - [4.3 API Service Modules](#43-api-service-modules)
- [5. Backend Integration Constraints](#5-backend-integration-constraints)
- [6. Component & Layout Architecture](#6-component--layout-architecture)
- [7. Directory Structure](#7-directory-structure)
- [8. Configuration & Environment Variables](#8-configuration--environment-variables)
- [9. Setup & Development](#9-setup--development)
- [10. Production Build & Deployment](#10-production-build--deployment)

---

## 1. Overview & Key Capabilities

- **Pipeline Health Dashboard:** Real-time visibility into the ULPF ingestion gateway and backend connectivity status.
- **Log Ingestion Simulator:** Submit arbitrary log payloads (JSON, Syslog, CEF, LEEF, or raw custom formats) for asynchronous pipeline processing.
- **Dynamic Format Detection:** Interactive playground to validate how log payloads match against installed parser plugins.
- **Parser Plugin Explorer:** Inspect active parser metadata, examine supported formats, trigger hot-reloads of newly installed plugins, and dry-run parsers on sample inputs.
- **Event Explorer & Search:** Search normalized logs stored in OpenSearch using full-text search, source filters, format filters, severity filters, and timestamps.
- **Cryptographic Audit Viewer:** Inspect parsed event attributes alongside the original immutable raw log archived in MinIO, complete with live SHA-256 verification.

---

## 2. Architectural Principles

- **Pure JavaScript & JSX:** Built strictly with standard JavaScript (`.jsx` for React components, `.js` for utilities and API services) without TypeScript complexity.
- **Decoupled API Layer:** UI components never make direct Axios calls; all network communication is encapsulated in domain-specific API modules.
- **Universal Error Normalization:** Network errors and HTTP error responses are intercepted and normalized into a consistent shape across the entire application.
- **Centralized Route Constants:** All route paths and navigation patterns are governed by a single constants file (`src/constants/routes.js`).
- **Resilient Polling & Monitoring:** Custom React hook (`useHealth`) provides on-demand and mount-time backend health monitoring without hammering the server.

---

## 3. Application Route Map

All routes are declared in `src/routes/AppRoutes.jsx` and rendered within the primary `AppLayout` shell:

| Route Path | Route Constant | Page Component | Description |
| :--- | :--- | :--- | :--- |
| `/` | `ROUTES.DASHBOARD` | `DashboardPage.jsx` | Pipeline status overview, quick actions, and module shortcuts |
| `/ingest` | `ROUTES.INGEST` | `IngestPage.jsx` | Raw log ingestion interface with source and format selection |
| `/events` | `ROUTES.EVENTS` | `EventsPage.jsx` | Paginated event search table with parametric filters |
| `/events/:eventId` | `ROUTES.EVENT_DETAIL` | `EventDetailPage.jsx` | Normalized event details and raw log SHA-256 verification |
| `/detect` | `ROUTES.DETECT` | `DetectionPage.jsx` | Format auto-detection testing tool with confidence scoring |
| `/parsers` | `ROUTES.PARSERS` | `ParsersPage.jsx` | List of installed parser plugins with hot-reload control |
| `/parsers/:parserId` | `ROUTES.PARSER_DETAIL` | `ParserDetailPage.jsx` | Detailed plugin specifications and dry-run tester |
| `*` | `ROUTES.NOT_FOUND` | `NotFoundPage.jsx` | Friendly 404 page with navigation back to the dashboard |

---

## 4. API Client & Service Layer

### 4.1 Centralized Axios Client & Interceptor

Located in `src/api/client.js`, the Axios client is pre-configured with the backend URL, default headers, and a 10-second timeout:

```javascript
import axios from "axios";
import { normalizeApiError } from "../utils/errorHandler.js";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000
});

// Response interceptor to normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);
```

### 4.2 Normalized Error Handling

Defined in `src/utils/errorHandler.js`, `normalizeApiError` transforms Axios errors, network timeouts, and HTTP status codes into a predictable structure:

```javascript
{
  message: "Event not found",     // Human-readable error message
  status: 404,                    // HTTP status code (or null for network errors)
  isNetworkError: false,          // True if the server was unreachable
  data: { ... }                   // Raw response body from the backend
}
```

### 4.3 API Service Modules

- **Health API (`src/api/healthApi.js`):**
  - `getHealth()`: Queries `GET /api/health` to verify backend status.
- **Events API (`src/api/eventsApi.js`):**
  - `ingestEvent(payload, options)`: Sends `POST /api/v1/events` for asynchronous queueing.
  - `getEvents(params)`: Queries `GET /api/v1/events` with pagination, text search, and filters.
  - `getEventById(id)`: Queries `GET /api/v1/events/:id` for normalized details.
  - `getRawEventById(id)`: Queries `GET /api/v1/events/:id/raw` for raw log and SHA-256 verification.
- **Parsers API (`src/api/parsersApi.js`):**
  - `getParsers()`: Queries `GET /api/v1/parsers` to list all plugins.
  - `getParserById(id)`: Queries `GET /api/v1/parsers/:id` for plugin metadata.
  - `reloadParsers()`: Calls `POST /api/v1/parsers/reload` to trigger runtime plugin discovery.
  - `testParser(id, payload)`: Calls `POST /api/v1/parsers/:id/test` for non-destructive dry-run parsing.
- **Detection API (`src/api/detectApi.js`):**
  - `detectFormat(payload)`: Calls `POST /api/v1/detect` to test raw log matching against plugins.

---

## 5. Backend Integration Constraints

When interacting with or extending the frontend, adhere to these backend contract rules:

1. **Strict CORS Policy:**
   The backend allows cross-origin requests originating strictly from `http://localhost:5173`. The Vite development server must remain configured on port `5173`.
2. **Asynchronous Ingestion:**
   `POST /api/v1/events` returns `HTTP 202 Accepted` immediately upon pushing to RabbitMQ. It does **not** return a synchronous `eventId`. The UI must inform the user that the event has been queued.
3. **OpenSearch Query Limits:**
   `GET /api/v1/events` enforces a maximum `limit` parameter of **100** items per request.
4. **No Native WebSockets:**
   The backend currently operates strictly over HTTP REST. Real-time updates should use user-initiated refreshes or bounded intervals rather than continuous polling.

---

## 6. Component & Layout Architecture

- **Layout Shell (`src/layouts/AppLayout.jsx`):**
  - Responsive layout container wrapping sidebar navigation, top header, and page content via `<Outlet />`.
- **Top Header (`src/components/layout/Header.jsx`):**
  - Displays the active page title, breadcrumb trail, and the interactive `HealthBadge`.
- **Sidebar (`src/components/layout/Sidebar.jsx`):**
  - Links to all major sections with active route highlighting using React Router's `NavLink`.
- **Health Badge (`src/components/layout/HealthBadge.jsx`):**
  - Live status indicator (Online / Offline) with an integrated refresh button.
- **Shared UI Elements (`src/components/common/`):**
  - `Card.jsx`: Standard card wrapper with header, subtitle, and action slots.
  - `Badge.jsx`: Color-coded status labels (`success`, `danger`, `warning`, `info`, `neutral`).
  - `LoadingSpinner.jsx`: Inline or centered loading animation.
  - `ErrorAlert.jsx`: Accessible error banner with optional dismiss button.

---

## 7. Directory Structure

```text
Frontend/
├── .env.development              # Dev environment (VITE_API_BASE_URL=http://localhost:5000)
├── .env.production               # Production environment
├── index.html                    # Root HTML document
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite config (port 5173, react plugin)
└── src/
    ├── main.jsx                  # Entry point with BrowserRouter
    ├── App.jsx                   # Application root component
    ├── index.css                 # Global CSS variables & layout styles
    ├── api/                      # Backend API integration layer
    │   ├── client.js             # Pre-configured Axios instance
    │   ├── detectApi.js          # Format detection API
    │   ├── eventsApi.js          # Event ingestion & search API
    │   ├── healthApi.js          # Health check API
    │   └── parsersApi.js         # Parser plugin management API
    ├── components/
    │   ├── common/               # Shared reusable components
    │   │   ├── Badge.jsx
    │   │   ├── Card.jsx
    │   │   ├── ErrorAlert.jsx
    │   │   └── LoadingSpinner.jsx
    │   └── layout/               # Application chrome components
    │       ├── Header.jsx
    │       ├── HealthBadge.jsx
    │       └── Sidebar.jsx
    ├── constants/
    │   └── routes.js             # Centralized route paths
    ├── hooks/
    │   └── useHealth.js          # Backend health check hook
    ├── layouts/
    │   └── AppLayout.jsx         # Application shell
    ├── pages/
    │   ├── Dashboard/            # Dashboard overview page
    │   ├── Detection/            # Format detection testing page
    │   ├── Events/               # Event list and detail pages
    │   ├── Ingest/               # Raw log ingestion page
    │   ├── NotFound/             # 404 page
    │   └── Parsers/              # Parser listing and detail pages
    ├── routes/
    │   └── AppRoutes.jsx         # Declarative route configuration
    └── utils/
        └── errorHandler.js       # Unified API error normalizer
```

---

## 8. Configuration & Environment Variables

Environment variables are prefixed with `VITE_` to expose them to the browser runtime:

### Development (`Frontend/.env.development`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Production (`Frontend/.env.production`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 9. Setup & Development

### 9.1 Install Dependencies
```bash
cd Frontend
npm install
```

### 9.2 Start Development Server
```bash
npm run dev
```

The application will be accessible at:
```text
http://localhost:5173/
```

*(Note: Port 5173 is enforced to match the backend CORS policy).*

---

## 10. Production Build & Deployment

### 10.1 Compile Production Bundle
```bash
npm run build
```

The compiled assets will be output to the `dist/` directory:
```text
dist/
├── assets/
│   ├── index-*.css
│   └── index-*.js
└── index.html
```

### 10.2 Preview Production Build Locally
```bash
npm run preview
```
Previews the production distribution on `http://localhost:4173` (or the configured preview port).
