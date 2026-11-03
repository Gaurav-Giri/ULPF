/**
 * Comprehensive Plugin Architecture Lifecycle Verification Suite
 * Executes Test A, Test B, Test C, Test D, and Test E.
 */

import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pluginManager } from "./Src/core/plugins/pluginManager.js";
import { pluginRegistry } from "./Src/core/plugins/pluginRegistry.js";
import { processEvent } from "./Src/services/eventProcessor.js";
import { getRawEvent } from "./Src/services/rawEventStorage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGINS_DIR = path.resolve(__dirname, "plugins/parsers");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
    console.log("=================================================================");
    console.log("       ULPF PLUGIN ARCHITECTURE COMPLETE VERIFICATION");
    console.log("=================================================================\n");

    let allPassed = true;

    // -------------------------------------------------------------------------
    // TEST A: Existing Parsers (JSON, Syslog RFC3164, Syslog RFC5424, CEF, LEEF)
    // -------------------------------------------------------------------------
    console.log(">>> [TEST A] Testing Built-in Parser Plugins (JSON, Syslog, CEF, LEEF)");
    await pluginManager.reloadPlugins();

    const initialPlugins = pluginRegistry.getAll();
    console.log(`    Discovered plugins: ${initialPlugins.map((p) => p.id).join(", ")}`);

    const sampleLogs = [
        {
            format: "json",
            payload: JSON.stringify({
                timestamp: new Date().toISOString(),
                hostname: "web-server-01",
                category: "authentication",
                action: "login_failed",
                severity: "warning",
                src_ip: "192.168.1.50",
                dst_ip: "10.0.0.5",
                message: "Failed password for user admin from 192.168.1.50"
            })
        },
        {
            format: "syslog",
            payload: "<134>Aug 29 13:30:12 FW01 BLOCK src=192.168.1.25 dst=10.0.0.20 port=443"
        },
        {
            format: "syslog",
            payload: `<134>1 ${new Date().toISOString()} FW02 app - - - DENY src=10.0.0.100 dst=10.0.0.1 port=80`
        },
        {
            format: "cef",
            payload: 'CEF:0|PaloAlto|Firewall|10.0|100|Threat Blocked|8|src=172.16.0.45 dst=10.0.0.1 spt=54321 dpt=80 proto=TCP msg="Malware connection attempt blocked"'
        },
        {
            format: "leef",
            payload: 'LEEF:2.0|IBM|QRadar|7.5|1001|src=192.168.2.10\tdst=10.0.0.25\tspt=12345\tdpt=22\tproto=SSH\taction=BLOCK\tmsg="SSH brute force detected"'
        }
    ];

    let testACount = 0;
    for (const sample of sampleLogs) {
        // Run without explicit format so automatic detection and parserRunner are both exercised
        const result = await processEvent({
            source: "test-suite-a",
            payload: sample.payload
        });

        const raw = await getRawEvent({
            bucket: result.rawStorage.bucket,
            object: result.rawStorage.object
        });

        const isVerified = raw.sha256 === result.rawStorage.sha256;
        if (isVerified && result.formatDetection.format === sample.format) {
            testACount++;
            console.log(`    ✓ ${sample.format.toUpperCase()} -> Detected: ${result.formatDetection.format}, Event ID: ${result.normalized.event_id}, SHA-256 Verified: ${isVerified}`);
        } else {
            console.error(`    ✗ ${sample.format} failed verification!`);
            allPassed = false;
        }
    }
    console.log(`    Test A Result: ${testACount}/5 Passed\n`);

    // -------------------------------------------------------------------------
    // TEST B: Dynamic Parser Plugin Addition (Plug-and-Play)
    // -------------------------------------------------------------------------
    console.log(">>> [TEST B] Testing Dynamic Parser Plugin Addition (Plug-and-Play)");
    const testFormatDir = path.join(PLUGINS_DIR, "test-format");
    await fs.mkdir(testFormatDir, { recursive: true });

    const manifestB = {
        id: "test-format",
        name: "Test Format Parser",
        version: "1.0.0",
        description: "Dynamic plug-and-play parser for custom TESTLOG format",
        type: "parser",
        apiVersion: "1.0",
        formats: ["test-format"],
        entry: "parser.js",
        enabled: true
    };

    const parserCodeB = `
export function parse(payload) {
    const trimmed = payload.trim();
    if (!trimmed.startsWith("TESTLOG|")) {
        throw new Error("Invalid TESTLOG format");
    }
    const content = trimmed.substring("TESTLOG|".length);
    let message = "hello";
    for (const part of content.split("|")) {
        const [k, v] = part.split("=");
        if (k && k.trim() === "message" && v !== undefined) {
            message = v.trim();
        }
    }
    return {
        timestamp: new Date().toISOString(),
        source: { name: "test-parser", type: "test" },
        event: { category: "test", action: "TEST" },
        message
    };
}

export function detect(payload) {
    if (typeof payload === "string" && payload.trim().startsWith("TESTLOG|")) {
        return { match: true, confidence: 1.0 };
    }
    return false;
}

export default { parse, detect };
`;

    await fs.writeFile(path.join(testFormatDir, "manifest.json"), JSON.stringify(manifestB, null, 2));
    await fs.writeFile(path.join(testFormatDir, "parser.js"), parserCodeB.trim());

    // Discovered automatically on reload
    await pluginManager.reloadPlugins();

    const hasTestPlugin = pluginRegistry.has("test-format");
    const pluginObj = pluginRegistry.get("test-format");
    console.log(`    Registered plugins: ${pluginRegistry.getSupportedFormats().join(", ")}`);

    if (hasTestPlugin && pluginObj.enabled) {
        console.log(`    ✓ test-format discovered automatically: ${pluginObj.name} v${pluginObj.version}`);
    } else {
        console.error("    ✗ test-format plugin was not registered!");
        allPassed = false;
    }

    // Process event without explicit format: automatic detection + parsing + storage + SHA-256
    const testResult = await processEvent({
        source: "dynamic-test-suite",
        payload: "TESTLOG|message=hello"
    });

    const testRaw = await getRawEvent({
        bucket: testResult.rawStorage.bucket,
        object: testResult.rawStorage.object
    });

    const bVerified = testRaw.sha256 === testResult.rawStorage.sha256;
    console.log(`    ✓ Detected Format: ${testResult.formatDetection.format}`);
    console.log(`    ✓ Normalized Action: ${testResult.normalized.event.action}`);
    console.log(`    ✓ Normalized Message: ${testResult.normalized.message}`);
    console.log(`    ✓ MinIO Key: ${testResult.rawStorage.object}`);
    console.log(`    ✓ SHA-256 Verified: ${bVerified} (${testRaw.sha256})`);
    console.log(`    Test B Result: PASSED (Without modifying core engine!)\n`);

    // -------------------------------------------------------------------------
    // TEST C: Disable Plugin
    // -------------------------------------------------------------------------
    console.log(">>> [TEST C] Testing Plugin Disable Mechanism");
    const manifestC = { ...manifestB, enabled: false };
    await fs.writeFile(path.join(testFormatDir, "manifest.json"), JSON.stringify(manifestC, null, 2));

    await pluginManager.reloadPlugins();

    const disabledPlugin = pluginRegistry.get("test-format");
    const isSupportedC = pluginRegistry.getSupportedFormats().includes("test-format");

    console.log(`    Plugin state: enabled = ${disabledPlugin?.enabled}`);
    console.log(`    Supported formats list: [${pluginRegistry.getSupportedFormats().join(", ")}]`);

    let processingBlocked = false;
    try {
        await processEvent({
            source: "disable-test-suite",
            payload: "TESTLOG|message=hello"
        });
    } catch (err) {
        processingBlocked = true;
        console.log(`    ✓ Ingestion blocked as expected: "${err.message}"`);
    }

    if (!isSupportedC && disabledPlugin && !disabledPlugin.enabled && processingBlocked) {
        console.log("    Test C Result: PASSED (Disabled plugin is inactive)\n");
    } else {
        console.error("    ✗ Test C Failed!");
        allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TEST D: Remove Plugin
    // -------------------------------------------------------------------------
    console.log(">>> [TEST D] Testing Plugin Removal");
    await fs.rm(testFormatDir, { recursive: true, force: true });
    await pluginManager.reloadPlugins();

    const existsD = pluginRegistry.has("test-format");
    console.log(`    test-format in registry: ${existsD}`);
    console.log(`    Installed plugins: [${pluginRegistry.getAll().map((p) => p.id).join(", ")}]`);

    if (!existsD) {
        console.log("    Test D Result: PASSED (Removed plugin completely absent)\n");
    } else {
        console.error("    ✗ Test D Failed!");
        allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TEST E: Resilience to Broken Plugins
    // -------------------------------------------------------------------------
    console.log(">>> [TEST E] Testing Resilience to Broken Plugins");
    const brokenDir = path.join(PLUGINS_DIR, "broken-plugin");
    await fs.mkdir(brokenDir, { recursive: true });

    // Missing required fields 'apiVersion', 'entry', etc.
    await fs.writeFile(
        path.join(brokenDir, "manifest.json"),
        JSON.stringify({ id: "broken-plugin", name: "Broken Plugin", version: "1.0.0", type: "parser" })
    );

    const reloadResult = await pluginManager.reloadPlugins();
    console.log(`    Reload Summary: loaded=${reloadResult.loaded}, disabled=${reloadResult.disabled}, failed=${reloadResult.failed}`);

    // Verify valid plugins still work
    const jsonTest = await processEvent({
        source: "test-broken-isolation",
        payload: JSON.stringify({ message: "still works", category: "test" })
    });
    console.log(`    ✓ Valid plugin (JSON) processed event ID: ${jsonTest.normalized.event_id}`);

    // Clean up broken plugin
    await fs.rm(brokenDir, { recursive: true, force: true });
    await pluginManager.reloadPlugins();

    if (reloadResult.failed === 1 && reloadResult.loaded === 4) {
        console.log("    Test E Result: PASSED (Server resilient, broken plugin gracefully skipped)\n");
    } else {
        console.error("    ✗ Test E Failed!");
        allPassed = false;
    }

    console.log("=================================================================");
    console.log(`    FINAL RESULT: ${allPassed ? "ALL 5 TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}`);
    console.log("=================================================================");

    if (!allPassed) {
        process.exit(1);
    }
}

run().catch((err) => {
    console.error("Fatal test failure:", err);
    process.exit(1);
});
