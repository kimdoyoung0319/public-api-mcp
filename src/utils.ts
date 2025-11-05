import { Logger, ConsoleTransportOptions, Transport, TransportPayload } from "@origranot/ts-logger";

export class ConsoleErrTransport extends Transport {
    private _options: ConsoleTransportOptions;

    constructor(options?: ConsoleTransportOptions) {
        super(options);

        if (options !== undefined) {
            this._options = options;
        } else {
            this._options = { fullFormat: true };
        }
    }

    handle(payload: TransportPayload) {
        if (!this._options.fullFormat) {
            payload.message = payload.message.split("\n")[0];
        }

        console.error(payload.message);
    }
}

const transport = new ConsoleErrTransport();

export const logger = new Logger({
    transports: [transport]
})
