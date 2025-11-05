import { Logger, ConsoleTransportOptions, Transport, TransportPayload, LOG_LEVEL } from "@origranot/ts-logger";
import { EnvFormatError } from "./error.js";
import "dotenv/config";

export class ConsoleErrTransport extends Transport {
    constructor(private readonly consoleOptions?: ConsoleTransportOptions) {
        super(consoleOptions);

        this.consoleOptions = consoleOptions || {};
        this.consoleOptions.fullFormat = this.consoleOptions.fullFormat ?? true;
    }

    handle({ message }: TransportPayload): void {
        if (!this.consoleOptions?.fullFormat) {
            message = message.split("\n")[0];
        }

        console.error(message);
    }
}

function parseLogLevel(): LOG_LEVEL | undefined {
    if (!process.env.LOG_LEVEL) {
        return undefined;
    }

    const upper = process.env.LOG_LEVEL.toUpperCase();

    if (upper in LOG_LEVEL) {
        return LOG_LEVEL[upper as keyof typeof LOG_LEVEL];
    } else {
        throw new EnvFormatError("LOG_LEVEL");
    }
}

const transport = new ConsoleErrTransport({
    threshold: parseLogLevel(),
});

export const logger = new Logger({
    transports: [transport],
});
