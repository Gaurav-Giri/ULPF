import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout.jsx";
import { DashboardPage } from "../pages/Dashboard/DashboardPage.jsx";
import { EventsPage } from "../pages/Events/EventsPage.jsx";
import { EventDetailPage } from "../pages/Events/EventDetailPage.jsx";
import { IngestPage } from "../pages/Ingest/IngestPage.jsx";
import { DetectionPage } from "../pages/Detection/DetectionPage.jsx";
import { ParsersPage } from "../pages/Parsers/ParsersPage.jsx";
import { ParserDetailPage } from "../pages/Parsers/ParserDetailPage.jsx";
import { NotFoundPage } from "../pages/NotFound/NotFoundPage.jsx";
import { ROUTES } from "../constants/routes.js";

/**
 * Application Routes definition.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.EVENTS} element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path={ROUTES.INGEST} element={<IngestPage />} />
        <Route path={ROUTES.DETECT} element={<DetectionPage />} />
        <Route path={ROUTES.PARSERS} element={<ParsersPage />} />
        <Route path="/parsers/:parserId" element={<ParserDetailPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
