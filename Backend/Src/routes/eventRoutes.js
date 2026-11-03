import express from "express";

import {
    ingestEvent,
    getEvents,
    getEventById,
    getRawEventById
} from "../controllers/eventController.js";

const router = express.Router();

router.post(
    "/",
    ingestEvent
);
router.get(
    "/",
    getEvents
);
router.get(
    "/:eventId/raw",
    getRawEventById
);
router.get(
    "/:eventId",
    getEventById
);

export default router;