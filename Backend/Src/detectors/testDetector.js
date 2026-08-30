import {
    detectFormat
} from "./formatDetector.js";

const tests = [
    {
        name: "Syslog",
        payload:
            "<134>Aug 29 13:30:12 FW01 BLOCK src=192.168.1.25"
    },

    {
        name: "JSON",
        payload:
            '{"event":"login_failed","user":"admin"}'
    },

    {
        name: "CEF",
        payload:
            "CEF:0|Vendor|Firewall|1.0|100|Login Failed|10|src=10.0.0.1"
    },

    {
        name: "LEEF",
        payload:
            "LEEF:2.0|Vendor|Firewall|1.0|100|src=10.0.0.1"
    },

    {
        name: "Unknown",
        payload:
            "HELLO THIS IS A RANDOM LOG"
    }
];

for (const test of tests) {
    console.log(
        test.name,
        "=>",
        detectFormat(test.payload)
    );
}