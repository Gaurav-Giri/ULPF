import {
    registerParser
} from "./parserRegistry.js";

import {
    parseSyslog
} from "../syslog/syslogParser.js";
import {
    parseJson
} from "../json/jsonParser.js";
import {
    parseCef
} from "../cef/cefParser.js";


export function registerAllParsers() {
    registerParser(
        "syslog",
        parseSyslog
    );

    registerParser(
        "json",
        parseJson
    );
    
    registerParser(
        "cef",
        parseCef
    );
}