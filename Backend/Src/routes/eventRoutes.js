import express from "express";

import {
    getEvents,
    getEventById,
    getRawEventById
} from "../controllers/eventController.js";

const router = express.Router();

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