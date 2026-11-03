/**
 * Application Route Path Constants
 */
export const ROUTES = {
  DASHBOARD: "/",
  EVENTS: "/events",
  EVENT_DETAIL: (eventId = ":eventId") => `/events/${eventId}`,
  INGEST: "/ingest",
  DETECT: "/detect",
  PARSERS: "/parsers",
  PARSER_DETAIL: (parserId = ":parserId") => `/parsers/${parserId}`,
  NOT_FOUND: "*"
};

export default ROUTES;
