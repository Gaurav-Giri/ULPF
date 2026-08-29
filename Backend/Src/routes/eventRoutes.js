import express from "express";

import {
    getEvents,
    getEventById
} from "../controllers/eventController.js";

const router = express.Router();

router.get(
    "/",
    getEvents
);
router.get(
    "/:eventId",
    getEventById
);

export default router;