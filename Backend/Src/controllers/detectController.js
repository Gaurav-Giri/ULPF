import { detectFormat } from "../detectors/formatDetector.js";

/**
 * Controller to independently test format detection against enabled parser plugins.
 * Reuses the existing formatDetector without ingesting or modifying data.
 */
export async function detectEventFormat(req, res) {
    try {
        if (!req.body || typeof req.body !== "object" || typeof req.body.payload !== "string" || !req.body.payload.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid request. Body must contain a non-empty string 'payload' field."
            });
        }

        const detection = detectFormat(req.body.payload);

        return res.status(200).json({
            success: true,
            format: detection.format,
            confidence: detection.confidence,
            data: detection
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Format detection failed: " + err.message
        });
    }
}
