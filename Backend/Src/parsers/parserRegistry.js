import { parseSyslog } from "./syslog/syslogParser.js";
import { parseJson } from "./json/jsonParser.js";

const parsers = {
    syslog: parseSyslog,
    json: parseJson
};

export function getParser(format) {
    const parser = parsers[format.toLowerCase()];

    if (!parser) {
        throw new Error(
            `Unsupported log format: ${format}`
        );
    }

    return parser;
}