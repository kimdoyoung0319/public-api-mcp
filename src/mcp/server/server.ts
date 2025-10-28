import { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Logger } from "@origranot/ts-logger";
import { ConsoleErrTransport } from "../../utils.js";
import { PUBLIC_API_TOOLS } from "./tools.js";

/** MCP 서버 생성자에 전달될 옵션. */
export interface PublicApiMcpServerOptions extends ServerOptions {
    /** 공공데이터포털 인증키. */
    publicApiAuthKey: string;
}

/** 공공API를 이용한 MCP 서버 클래스. */
export class PublicApiMcpServer extends McpServer {
    private _authKey: string;
    private _logger: Logger;

    /**
     * 공공API를 이용한 MCP 서버의 생성자.
     *
     * @param options 서버 생성시 전달될 옵션. `PublicApiMcpServerOptions` 참조.
     */
    constructor(options: PublicApiMcpServerOptions) {
        super(
            {
                name: "public-api-mcp-server",
                version: "1.0.0",
            },
            options
        );

        this._authKey = options.publicApiAuthKey;

        const transport = new ConsoleErrTransport();

        this._logger = new Logger({
            transports: [transport],
        });

        for (const tool of PUBLIC_API_TOOLS) {
            super.registerTool(tool.name, tool.config, tool.callback);
        }
    }
}
