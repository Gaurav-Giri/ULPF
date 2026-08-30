const parsers = new Map();

export function registerParser(format, parser) {
    if (!format) {
        throw new Error("Parser format is required");
    }

    if (typeof parser !== "function") {
        throw new Error(
            `Parser for ${format} must be a function`
        );
    }

    const normalizedFormat =
        format.toLowerCase();

    if (parsers.has(normalizedFormat)) {
        throw new Error(
            `Parser already registered: ${normalizedFormat}`
        );
    }

    parsers.set(
        normalizedFormat,
        parser
    );
}

export function getParser(format) {
    if (!format) {
        return null;
    }

    return parsers.get(
        format.toLowerCase()
    ) || null;
}

export function hasParser(format) {
    if (!format) {
        return false;
    }

    return parsers.has(
        format.toLowerCase()
    );
}

export function getSupportedFormats() {
    return [...parsers.keys()];
}