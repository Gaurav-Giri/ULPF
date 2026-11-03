import express from "express";
import {
    getInstalledParsers,
    getParserById,
    reloadParserPlugins,
    testParserPlugin
} from "../controllers/parserController.js";

const router = express.Router();

// List all installed parser plugins
router.get("/", getInstalledParsers);

// Specific action routes MUST be declared before parameterized /:id route
router.post("/reload", reloadParserPlugins);

// Single parser test / dry-run route
router.post("/:id/test", testParserPlugin);

// Single parser details route
router.get("/:id", getParserById);

export default router;
