import fetch from "node-fetch";

const API_BASE = "http://localhost:5000/api/v1/events";
const HEALTH_URL = "http://localhost:5000/api/health";

const TEST_TAG = `test_run_${Date.now()}`;

const sampleLogs = [
    {
        name: "JSON Log",
        body: {
            source: TEST_TAG,
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
        }
    },
    {
        name: "RFC 3164 Syslog",
        body: {
            source: TEST_TAG,
            payload: "<134>Aug 29 13:30:12 FW01 BLOCK src=192.168.1.25 dst=10.0.0.20 port=443"
        }
    },
    {
        name: "RFC 5424 Syslog",
        body: {
            source: TEST_TAG,
            payload: `<134>1 ${new Date().toISOString()} FW02 app - - - DENY src=10.0.0.100 dst=10.0.0.1 port=80`
        }
    },
    {
        name: "CEF Log",
        body: {
            source: TEST_TAG,
            payload: "CEF:0|PaloAlto|Firewall|10.0|100|Threat Blocked|8|src=172.16.0.45 dst=10.0.0.1 spt=54321 dpt=80 proto=TCP msg=\"Malware connection attempt blocked\""
        }
    },
    {
        name: "LEEF Log",
        body: {
            source: TEST_TAG,
            payload: "LEEF:2.0|IBM|QRadar|7.5|1001|src=192.168.2.10\tdst=10.0.0.25\tspt=12345\tdpt=22\tproto=SSH\taction=BLOCK\tmsg=\"SSH brute force detected\""
        }
    }
];

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
    console.log("==================================================");
    console.log("   ULPF BACKEND END-TO-END INTEGRATION TEST");
    console.log("==================================================\n");

    // 1. Health Check
    console.log("[Step 1] Checking Backend Health...");
    try {
        const res = await fetch(HEALTH_URL);
        const health = await res.json();
        console.log("  Status:", res.status, health);
        if (res.status !== 200) {
            throw new Error("Health check failed!");
        }
    } catch (err) {
        console.error("  Health check failed. Make sure ULPF backend is running on port 5000!");
        console.error("  Error:", err.message);
        process.exit(1);
    }

    const startTime = new Date(Date.now() - 5000).toISOString();

    // 2. Ingest Logs
    console.log(`\n[Step 2] Ingesting Sample Logs Across Formats...`);
    for (const log of sampleLogs) {
        try {
            const res = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(log.body)
            });
            const data = await res.json();
            console.log(`  [POST] ${log.name}: HTTP ${res.status} => ${data.message}`);
        } catch (err) {
            console.error(`  [POST] ${log.name} failed:`, err.message);
        }
    }

    // Wait for worker queue processing
    console.log("\n[Step 3] Waiting 3 seconds for RabbitMQ worker & OpenSearch indexing...");
    await delay(3000);

    console.log("\n[Step 4] Querying OpenSearch for newly ingested events...");
    try {
        const res = await fetch(`${API_BASE}?limit=20`);
        const data = await res.json();
        console.log(`  [GET] OpenSearch Total Indexed Events in System: ${data.data?.total || 0}`);
        
        const allEvents = data.data?.events || [];
        const freshEvents = allEvents.filter(e => e.received_at && new Date(e.received_at) >= new Date(startTime));
        console.log(`  Found ${freshEvents.length} fresh events ingested in this test run.`);
        if (freshEvents.length > 0) {
            let passCount = 0;
            let failCount = 0;

            console.log(`\n[Step 5 & 6] Testing Individual Event Details & Cryptographic Integrity...`);
            for (const sampleEvent of freshEvents.slice(0, 5)) {
                const eventId = sampleEvent.event_id;
                const rawRes = await fetch(`${API_BASE}/${eventId}/raw`);
                const rawData = await rawRes.json();
                
                const isVerified = rawData.data?.sha256?.verified === true;
                if (isVerified) {
                    passCount++;
                } else {
                    failCount++;
                }

                console.log(`\n  --- Event ID: ${eventId} (${sampleEvent.raw?.format}) ---`);
                console.log("    Format           :", sampleEvent.raw?.format);
                console.log("    MinIO Object Key :", rawData.data?.object);
                console.log("    SHA-256 Stored   :", rawData.data?.sha256?.stored);
                console.log("    SHA-256 Calculated:", rawData.data?.sha256?.calculated);
                console.log("    Integrity Status :", isVerified ? "✅ PASSED" : "❌ FAILED");
            }

            console.log(`\n[Result] Verification Summary: ${passCount} Passed, ${failCount} Failed.`);
        } else {
            console.log("  No events found in OpenSearch query response.");
        }
    } catch (err) {
        console.error("  Search query failed:", err.message);
    }

    console.log("\n==================================================");
    console.log("   TEST COMPLETE");
    console.log("==================================================");
}

runTests();

