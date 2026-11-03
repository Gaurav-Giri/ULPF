import express from "express";
import { detectEventFormat } from "../controllers/detectController.js";

const router = express.Router();

router.post("/", detectEventFormat);

export default router;
